import { Router, RequestHandler } from 'express';
import { AuthController } from './auth.controller';
import { validateBody, validateQuery } from '../../middlewares/validateMiddleware';
import {
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
  resendVerificationSchema,
} from './auth.schema';

const createAuthRouter = (authLimiter: RequestHandler): Router => {
  const router = Router();

  // Public endpoints with strict rate limiting on brute-force-sensitive routes
  router.post('/signup', authLimiter, validateBody(signupSchema), AuthController.signup);
  router.get('/verify-email', validateQuery(verifyEmailSchema), AuthController.verifyEmail);
  router.post('/resend-verification', authLimiter, validateBody(resendVerificationSchema), AuthController.resendVerification);
  router.post('/signin', authLimiter, validateBody(signinSchema), AuthController.signin);
  router.post('/refresh', validateBody(refreshSchema), AuthController.refresh);
  router.post('/logout', validateBody(logoutSchema), AuthController.logout);
  router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
  router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

  return router;
};

export default createAuthRouter;
