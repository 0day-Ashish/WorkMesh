import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    passwordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)'
  );

// Reusable normalized email field: trim whitespace first, validate format, then lowercase
const normalizedEmail = z.string()
  .trim()
  .email('Invalid email format')
  .transform((val) => val.toLowerCase());

export const signupSchema = z.object({
  employee_code: z.string().trim().min(1, 'Employee code is required'),
  email: normalizedEmail,
  password: strongPassword,
});

export const signinSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const forgotPasswordSchema = z.object({
  email: normalizedEmail,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: strongPassword,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const resendVerificationSchema = z.object({
  email: normalizedEmail,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
