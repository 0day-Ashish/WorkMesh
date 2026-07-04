import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import prisma from '../../config/db';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { Role } from '@prisma/client';

const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Long-lived

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  employee_id: string | null;
}

export class AuthService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize Nodemailer transporter
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      // Real SMTP Config
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      // Ethereal / Fallback Config
      console.log('No SMTP credentials provided in env. Generating Ethereal test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`Ethereal test account generated: user=${testAccount.user}`);
      } catch (err) {
        console.error('Failed to create Ethereal test account, falling back to console logging logger.');
        // Fallback dummy transporter
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      }
    }

    return this.transporter!;
  }

  // Hash helper (SHA256) for storing refresh & reset tokens in DB
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Normalize email to prevent duplicate accounts via case tricks
  public static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // Get the secret for access tokens
  private static getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';
  }

  // Get the secret for refresh tokens
  private static getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_1234567890';
  }

  // Generate Access Token
  public static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.getAccessSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  // Generate Email Verification Token (signed 24h JWT) — uses REFRESH secret to
  // prevent cross-token attacks where an access token is used as a verification token
  public static generateVerificationToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: 'email_verification' },
      this.getRefreshSecret(),
      { expiresIn: '24h' }
    );
  }

  // Verify Email Verification Token
  public static verifyVerificationToken(token: string): string {
    let decoded: { sub: string; type: string };
    try {
      decoded = jwt.verify(token, this.getRefreshSecret()) as { sub: string; type: string };
    } catch (error) {
      throw new BadRequestError('Verification token is invalid or has expired');
    }

    // Validate token type OUTSIDE the try-catch so our own BadRequestError isn't swallowed
    if (decoded.type !== 'email_verification') {
      throw new BadRequestError('Invalid token type');
    }

    return decoded.sub;
  }

  // Generate Refresh Token & Save to DB
  public static async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return rawToken;
  }

  // Refresh Tokens: Validate and Rotate (revoke old, generate new)
  // Implements token family invalidation: if a revoked token is reused,
  // ALL refresh tokens for that user are revoked (potential theft detected).
  public static async refreshAccessToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            employee_id: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // SECURITY: If a revoked token is reused, an attacker may have stolen a token.
    // Revoke ALL tokens for this user to force re-authentication on all devices.
    if (storedToken.revoked_at) {
      await prisma.refreshToken.updateMany({
        where: { user_id: storedToken.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedError('Refresh token reuse detected. All sessions have been revoked for security. Please sign in again.');
    }

    if (new Date() > storedToken.expires_at) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Generate new set of tokens (rotation)
    const userPayload: TokenPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      employee_id: storedToken.user.employee_id,
    };

    const newAccessToken = this.generateAccessToken(userPayload);
    const newRefreshToken = await this.generateRefreshToken(storedToken.user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Revoke Refresh Token (Logout)
  public static async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!storedToken) return; // Silent return if token doesn't exist

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });
  }

  // Forgot Password: Issue a Reset Token
  public static async generatePasswordResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // To prevent account enumeration, we don't throw 404 here, but we return a generic message in the controller.
      // However internally, we need to handle this. Let's throw NotFound to let the controller handle it safely.
      throw new NotFoundError('No account with that email address exists');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // Clean up any existing reset tokens for this user before creating a new one.
    // This prevents accumulation of stale tokens and ensures only the latest is valid.
    await prisma.passwordReset.deleteMany({
      where: { user_id: user.id },
    });

    // Save new token hash to DB
    await prisma.passwordReset.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return rawToken;
  }

  // Reset Password using token
  public static async resetPassword(rawToken: string, newPasswordPlain: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const storedReset = await prisma.passwordReset.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedReset) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    if (new Date() > storedReset.expires_at) {
      // Clean up expired token
      await prisma.passwordReset.delete({ where: { id: storedReset.id } }).catch(() => {});
      throw new BadRequestError('Password reset token has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);

    // Update user password and delete password resets (single transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedReset.user_id },
        data: { password_hash: hashedPassword },
      }),
      prisma.passwordReset.deleteMany({
        where: { user_id: storedReset.user_id },
      }),
      // Also revoke all refresh tokens (force sign-in on all devices)
      prisma.refreshToken.updateMany({
        where: { user_id: storedReset.user_id },
        data: { revoked_at: new Date() },
      }),
    ]);
  }

  // Send verification email
  public static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const port = process.env.PORT || '3000';
    const verifyUrl = `http://localhost:${port}/api/auth/verify-email?token=${token}`;

    const transporter = await this.getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"WorkMesh HR" <no-reply@workmesh.com>',
      to: email,
      subject: 'Verify your WorkMesh Email',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for signing up at WorkMesh. Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
        <p>This link is valid for 24 hours.</p>
      `,
    };

    console.log(`[Verification Email] Sent to: ${email}`);
    console.log(`[Verification Link]: ${verifyUrl}`);

    const info = await transporter.sendMail(mailOptions);
    if (info && info.messageId && info.messageId.includes('ethereal')) {
      console.log(`Preview email URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  // Send password reset email
  public static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const clientUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    // Password reset happens on the frontend client (which has a form that calls POST /auth/reset-password)
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    const transporter = await this.getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"WorkMesh HR" <no-reply@workmesh.com>',
      to: email,
      subject: 'WorkMesh Password Reset',
      html: `
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
        <p>This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      `,
    };

    console.log(`[Password Reset Email] Sent to: ${email}`);
    console.log(`[Password Reset Link]: ${resetUrl}`);

    const info = await transporter.sendMail(mailOptions);
    if (info && info.messageId && info.messageId.includes('ethereal')) {
      console.log(`Preview email URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }
}
