import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import createAuthRouter from './modules/auth/auth.routes';
import leaveRouter from './modules/leave/routes/leave.routes';
import payrollRouter from './modules/payroll/routes/payroll.routes';
import createEmployeesRouter from './modules/employees/employees.routes';
import createDepartmentsRouter from './modules/departments/departments.routes';
import createDocumentsRouter from './modules/documents/documents.routes';
import createAttendanceRouter from './modules/attendance/attendance.routes';
import createHolidaysRouter from './modules/holidays/holidays.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Disable X-Powered-By header (info leakage)
app.disable('x-powered-by');

// Security headers (XSS, clickjacking, MIME sniffing protection)
app.use(helmet());

// Request logging (skip in test environment to keep test output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS configurations
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with size limit to prevent DoS via large payloads
app.use(express.json({ limit: '10kb' }));

const isTest = process.env.NODE_ENV === 'test';

// Rate limiter: general API — 100 requests per 15 minutes per IP
const generalLimiter = isTest
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many requests from this IP, please try again later.' },
    });

// Rate limiter: strict for auth-sensitive endpoints — 10 requests per 15 minutes per IP
const authLimiter = isTest
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Too many authentication attempts. Please try again later.' },
    });

app.use('/api', generalLimiter);

// Auth routes (auth-sensitive endpoints get stricter rate limiting via route-level middleware)
app.use('/api/auth', createAuthRouter(authLimiter));
app.use('/api/leave', leaveRouter);
app.use('/api/payroll', payrollRouter);

// Other core routes
app.use('/api/employees', createEmployeesRouter());
app.use('/api/departments', createDepartmentsRouter());
app.use('/api/documents', createDocumentsRouter());
app.use('/api/attendance', createAttendanceRouter());
app.use('/api/holidays', createHolidaysRouter());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 handler — catch all undefined routes and return JSON instead of Express default HTML
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Centralized error handling
app.use(errorHandler);

export default app;
