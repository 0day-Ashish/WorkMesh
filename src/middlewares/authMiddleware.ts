import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'employee';
        employee_id: string | null;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or invalid'));
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';
    decoded = jwt.verify(token, accessSecret) as {
      id: string;
      email: string;
      role: 'admin' | 'employee';
      employee_id: string | null;
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired'));
    }
    return next(new UnauthorizedError('Access token is invalid'));
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    employee_id: decoded.employee_id,
  };

  next();
};
