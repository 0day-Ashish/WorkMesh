import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Zod schema validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({ errors });
  }

  // Custom application errors
  if (err instanceof AppError || (err && typeof (err as any).statusCode === 'number' && (err as any).isOperational === true)) {
    return res.status((err as any).statusCode).json({ message: err.message });
  }

  // Prisma unique constraint validation
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const targets = prismaErr.meta?.target as string[] | undefined;
      const field = targets ? targets.join('.') : 'field';
      return res.status(409).json({
        message: `Unique constraint failed on ${field}. A record with this value already exists.`,
      });
    }
  }

  // Fallback for unhandled/internal server errors
  console.error('[Unhandled Internal Error]:', err);
  return res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
};
