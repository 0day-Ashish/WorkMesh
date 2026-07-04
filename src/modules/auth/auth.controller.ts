import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from './auth.service';
import prisma from '../../config/db';
import * as bcrypt from 'bcryptjs';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import { Role } from '@prisma/client';

export class AuthController {
  // POST /auth/signup
  public static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employee_code, password } = req.body;
      // Normalize email to prevent duplicate accounts via case tricks (e.g. User@MAIL.com vs user@mail.com)
      const email = AuthService.normalizeEmail(req.body.email);

      // 1. Find employee code in employees table
      const employee = await prisma.employee.findUnique({
        where: { employee_code },
      });

      if (!employee) {
        throw new BadRequestError('Invalid employee code. Please contact HR.');
      }

      // 2. Check if employee code has already been claimed (linked to a user)
      if (employee.user_id) {
        throw new ConflictError('This employee code has already been claimed.');
      }

      // 3. Check if employee is terminated
      if (employee.status === 'terminated') {
        throw new BadRequestError('This employee code belongs to a terminated employee. Please contact HR.');
      }

      // 4. Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('An account with this email address already exists.');
      }

      // 5. Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // 6. Create user & link to employee in a transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password_hash: passwordHash,
            role: Role.employee, // Role is ALWAYS employee at signup
            email_verified: false,
            employee_id: employee.id,
          },
        });

        await tx.employee.update({
          where: { id: employee.id },
          data: { user_id: user.id },
        });

        // Initialize default leave balances for the new employee
        await tx.leaveBalance.createMany({
          data: [
            { employee_id: employee.id, leave_type: "Casual", total: 10, remaining: 10 },
            { employee_id: employee.id, leave_type: "Sick", total: 12, remaining: 12 },
            { employee_id: employee.id, leave_type: "Earned", total: 15, remaining: 15 },
          ]
        });

        return user;
      });

      // 7. Generate verification token & send email (non-blocking)
      const verificationToken = AuthService.generateVerificationToken(newUser.id);
      AuthService.sendVerificationEmail(email, verificationToken).catch((err) => {
        console.error(`Failed to send verification email to ${email}:`, err);
      });

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /auth/verify-email
  public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new BadRequestError('Verification token is required.');
      }

      const userId = AuthService.verifyVerificationToken(token);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found.');
      }

      if (user.email_verified) {
        res.status(200).json({ message: 'Email has already been verified.' });
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { email_verified: true },
      });

      res.status(200).json({
        message: 'Email verified successfully. You can now sign in.',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/resend-verification
  public static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = AuthService.normalizeEmail(req.body.email);

      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to prevent account enumeration
      if (!user || user.email_verified) {
        res.status(200).json({
          message: 'If that email address exists and is unverified, we have sent a new verification link.',
        });
        return;
      }

      const verificationToken = AuthService.generateVerificationToken(user.id);
      AuthService.sendVerificationEmail(email, verificationToken).catch((err) => {
        console.error(`Failed to resend verification email to ${email}:`, err);
      });

      res.status(200).json({
        message: 'If that email address exists and is unverified, we have sent a new verification link.',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/signin
  public static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Normalize email to match stored format
      const email = AuthService.normalizeEmail(req.body.email);
      const { password } = req.body;

      // 1. Find user by email, include employee status
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          employee: {
            select: { status: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      // 2. Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      // 3. Check if email is verified
      if (!user.email_verified) {
        throw new UnauthorizedError('Please verify your email before signing in.');
      }

      // 4. Check if employee is terminated
      if (user.employee && user.employee.status === 'terminated') {
        throw new UnauthorizedError('Your account has been deactivated. Please contact HR.');
      }

      // 5. Generate access & refresh tokens
      const payload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
      };

      const accessToken = AuthService.generateAccessToken(payload);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      res.status(200).json({
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/refresh
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/logout
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await AuthService.revokeRefreshToken(refreshToken);

      res.status(200).json({
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/forgot-password
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Normalize email
      const email = AuthService.normalizeEmail(req.body.email);

      try {
        const resetToken = await AuthService.generatePasswordResetToken(email);
        AuthService.sendPasswordResetEmail(email, resetToken).catch((err) => {
          console.error(`Failed to send password reset email to ${email}:`, err);
        });
      } catch (err) {
        // If user not found, absorb error to prevent account enumeration
        if (!(err instanceof NotFoundError)) {
          throw err;
        }
      }

      res.status(200).json({
        message: 'If that email address exists in our system, we have sent a password reset link.',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/reset-password
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      await AuthService.resetPassword(token, password);

      res.status(200).json({
        message: 'Password reset successfully. You can now sign in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }
}
