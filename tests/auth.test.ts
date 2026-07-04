import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { signupSchema } from '../src/modules/auth/auth.schema';

// Mock the Prisma client
jest.mock('../src/config/db', () => {
  const mockPrisma = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordReset: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    attendance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    attendanceRegularization: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    holiday: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    leaveRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leaveBalance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  mockPrisma.$transaction.mockImplementation((cb: any) => {
    if (typeof cb === 'function') return cb(mockPrisma);
    return Promise.resolve(cb); // Handle array-based transactions
  });

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

describe('Auth Validation Schemas', () => {
  it('should validate signup schema with correct inputs', () => {
    const valid = signupSchema.safeParse({
      employee_code: 'EMP001',
      email: 'test@example.com',
      password: 'StrongPassword123!',
    });
    expect(valid.success).toBe(true);
  });

  it('should reject signup schema with weak passwords', () => {
    const invalid = signupSchema.safeParse({
      employee_code: 'EMP001',
      email: 'test@example.com',
      password: 'weak',
    });
    expect(invalid.success).toBe(false);
  });

  it('should normalize email to lowercase', () => {
    const result = signupSchema.safeParse({
      employee_code: 'EMP001',
      email: '  User@EXAMPLE.COM  ',
      password: 'StrongPassword123!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should trim employee_code whitespace', () => {
    const result = signupSchema.safeParse({
      employee_code: '  EMP001  ',
      email: 'test@example.com',
      password: 'StrongPassword123!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employee_code).toBe('EMP001');
    }
  });
});

describe('Auth Middlewares', () => {
  const express = require('express');
  const { authMiddleware } = require('../src/middlewares/authMiddleware');
  const { requireRole } = require('../src/middlewares/roleMiddleware');
  const { errorHandler } = require('../src/middlewares/errorHandler');

  const testApp = express();
  testApp.use(express.json());

  testApp.get('/test-employee-route', authMiddleware, requireRole(['employee']), (req: any, res: any) => {
    res.status(200).json({ data: 'success' });
  });

  testApp.get('/test-admin-route', authMiddleware, requireRole(['admin']), (req: any, res: any) => {
    res.status(200).json({ data: 'success' });
  });

  testApp.use(errorHandler);

  it('should reject access with no token', async () => {
    const res = await request(testApp).get('/test-employee-route');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Access token is missing');
  });

  it('should reject access with invalid token', async () => {
    const res = await request(testApp)
      .get('/test-employee-route')
      .set('Authorization', 'Bearer invalidtokenhere');
    expect(res.status).toBe(401);
  });

  it('should allow access to employee route with valid employee token', async () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';
    const token = jwt.sign(
      { id: '123', email: 'emp@workmesh.com', role: 'employee', employee_id: 'emp-123' },
      secret
    );

    const res = await request(testApp)
      .get('/test-employee-route')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBe('success');
  });

  it('should reject employee from accessing admin route', async () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';
    const token = jwt.sign(
      { id: '123', email: 'emp@workmesh.com', role: 'employee', employee_id: 'emp-123' },
      secret
    );

    const res = await request(testApp)
      .get('/test-admin-route')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should reject requests with expired tokens', async () => {
    const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';
    const token = jwt.sign(
      { id: '123', email: 'emp@workmesh.com', role: 'employee', employee_id: 'emp-123' },
      secret,
      { expiresIn: '0s' } // Already expired
    );

    // Small delay to ensure token is expired
    await new Promise((resolve) => setTimeout(resolve, 50));

    const res = await request(testApp)
      .get('/test-employee-route')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('expired');
  });
});

describe('Auth Controller Endpoints', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.resolve(cb);
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should register successfully when claiming an unclaimed employee code', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-id-123',
        employee_code: 'EMP002',
        user_id: null,
        status: 'active',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id-123',
        email: 'newuser@workmesh.com',
      });
      mockPrisma.employee.update.mockResolvedValue({
        id: 'emp-id-123',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          employee_code: 'EMP002',
          email: 'newuser@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Registration successful');
    });

    it('should fail registration if employee code does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          employee_code: 'EMP999',
          email: 'newuser@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid employee code');
    });

    it('should fail registration if employee code is already claimed', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-id-123',
        employee_code: 'EMP002',
        user_id: 'existing-user-id',
        status: 'active',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          employee_code: 'EMP002',
          email: 'newuser@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('claimed');
    });

    it('should fail registration for terminated employees', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-id-123',
        employee_code: 'EMP002',
        user_id: null,
        status: 'terminated',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          employee_code: 'EMP002',
          email: 'newuser@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('terminated');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in successfully with valid credentials and verified email', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'user@workmesh.com',
        password_hash: passwordHash,
        role: 'employee',
        email_verified: true,
        employee_id: 'emp-id-123',
        employee: { status: 'active' },
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-id' });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'user@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should fail sign in with incorrect password', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'user@workmesh.com',
        password_hash: passwordHash,
        role: 'employee',
        email_verified: true,
        employee_id: 'emp-id-123',
        employee: { status: 'active' },
      });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'user@workmesh.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should fail sign in if email is not verified', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'user@workmesh.com',
        password_hash: passwordHash,
        role: 'employee',
        email_verified: false,
        employee_id: 'emp-id-123',
        employee: { status: 'active' },
      });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'user@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('verify your email');
    });

    it('should fail sign in for terminated employees', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'user@workmesh.com',
        password_hash: passwordHash,
        role: 'employee',
        email_verified: true,
        employee_id: 'emp-id-123',
        employee: { status: 'terminated' },
      });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'user@workmesh.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('deactivated');
    });

    it('should normalize email case on sign in', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'user@workmesh.com',
        password_hash: passwordHash,
        role: 'employee',
        email_verified: true,
        employee_id: 'emp-id-123',
        employee: { status: 'active' },
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-id' });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'USER@WorkMesh.COM',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      // Verify the normalized email was used for DB lookup
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user@workmesh.com' },
        })
      );
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with a valid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id-123',
        revoked_at: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-valid-token' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });

    it('should fail logout without a refresh token in body', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent emails (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@workmesh.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If that email address exists');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should fail without a refresh token in body', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should return success for unverified user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'unverified@workmesh.com',
        email_verified: false,
      });

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'unverified@workmesh.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('verification link');
    });

    it('should return success even for non-existent emails (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nobody@workmesh.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('verification link');
    });

    it('should return success for already-verified user without resending', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id-123',
        email: 'verified@workmesh.com',
        email_verified: true,
      });

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'verified@workmesh.com' });

      expect(res.status).toBe(200);
    });
  });
});

describe('404 Handler', () => {
  it('should return JSON 404 for undefined routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });
});
