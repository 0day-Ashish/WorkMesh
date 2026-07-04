import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import * as jwt from 'jsonwebtoken';
import { RequestStatus } from '@prisma/client';

// Mock Prisma client for our modules test
jest.mock('../src/config/db', () => {
  const mockPrisma = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
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
  };

  mockPrisma.$transaction.mockImplementation((cb: any) => {
    if (typeof cb === 'function') return cb(mockPrisma);
    return Promise.resolve(cb);
  });

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

const mockPrisma = prisma as any;
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_1234567890';

const adminToken = jwt.sign(
  { id: 'admin-user-id', email: 'admin@workmesh.com', role: 'admin', employee_id: 'admin-emp-id' },
  JWT_SECRET
);

const employeeToken = jwt.sign(
  { id: 'emp-user-id', email: 'employee@workmesh.com', role: 'employee', employee_id: 'emp-id-123' },
  JWT_SECRET
);

describe('WorkMesh Core Modules API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.resolve(cb);
    });
  });

  describe('Employees Module', () => {
    it('should fetch own employee details', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp-id-123',
        employee_code: 'EMP001',
        full_name: 'John Doe',
      });

      const res = await request(app)
        .get('/api/employees/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe('John Doe');
      expect(mockPrisma.employee.findUnique).toHaveBeenCalled();
    });

    it('should patch own employee details', async () => {
      mockPrisma.employee.update.mockResolvedValue({
        id: 'emp-id-123',
        full_name: 'John Updated',
      });

      const res = await request(app)
        .patch('/api/employees/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ full_name: 'John Updated' });

      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe('John Updated');
    });

    it('should list all employees for admin only', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([
        { id: '1', full_name: 'Emp 1' },
        { id: '2', full_name: 'Emp 2' },
      ]);

      const resAdmin = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body).toHaveLength(2);

      const resEmp = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(resEmp.status).toBe(403); // Forbidden
    });
  });

  describe('Departments Module', () => {
    it('should allow admin to create a department', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);
      mockPrisma.department.create.mockResolvedValue({
        id: 'dept-id-1',
        name: 'Finance',
      });

      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Finance' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Finance');
    });

    it('should prevent employee from creating department', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Security' });

      expect(res.status).toBe(403);
    });
  });

  describe('Documents Module', () => {
    it('should allow employee to get their own documents', async () => {
      mockPrisma.document.findMany.mockResolvedValue([
        { id: 'doc-1', doc_type: 'Resume' },
      ]);

      const res = await request(app)
        .get('/api/documents/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should allow employee to upload document', async () => {
      mockPrisma.document.create.mockResolvedValue({
        id: 'doc-1',
        doc_type: 'ID Proof',
        file_url: 'http://example.com/id.pdf',
      });

      const res = await request(app)
        .post('/api/documents/me')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ doc_type: 'ID Proof', file_url: 'http://example.com/id.pdf' });

      expect(res.status).toBe(201);
      expect(res.body.doc_type).toBe('ID Proof');
    });
  });

  describe('Attendance Module', () => {
    it('should allow employee to check-in', async () => {
      mockPrisma.attendance.findUnique.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-1',
        status: 'Present',
      });

      const res = await request(app)
        .post('/api/attendance/checkin')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.attendance.create).toHaveBeenCalled();
    });

    it('should allow employee to check-out', async () => {
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        check_in: new Date(),
      });
      mockPrisma.attendance.update.mockResolvedValue({
        id: 'att-1',
        check_out: new Date(),
      });

      const res = await request(app)
        .post('/api/attendance/checkout')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.attendance.update).toHaveBeenCalled();
    });

    it('should allow employee to file regularization request', async () => {
      mockPrisma.attendanceRegularization.create.mockResolvedValue({
        id: 'reg-1',
        reason: 'Missed card swipe',
      });

      const res = await request(app)
        .post('/api/attendance/regularizations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: '2026-07-04',
          reason: 'Missed card swipe',
        });

      expect(res.status).toBe(201);
      expect(res.body.reason).toBe('Missed card swipe');
    });

    it('should allow admin to approve regularization request', async () => {
      mockPrisma.attendanceRegularization.findUnique.mockResolvedValue({
        id: 'reg-1',
        status: RequestStatus.Pending,
        employee_id: 'emp-id-123',
        date: new Date('2026-07-04'),
        requested_check_in: new Date('2026-07-04T09:00:00Z'),
        requested_check_out: new Date('2026-07-04T17:00:00Z'),
      });
      mockPrisma.attendanceRegularization.update.mockResolvedValue({
        id: 'reg-1',
        status: RequestStatus.Approved,
      });

      const res = await request(app)
        .patch('/api/attendance/regularizations/reg-1/decision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: RequestStatus.Approved });

      expect(res.status).toBe(200);
      expect(mockPrisma.attendance.upsert).toHaveBeenCalled();
    });
  });

  describe('Holidays Module', () => {
    it('should list holidays publicly', async () => {
      mockPrisma.holiday.findMany.mockResolvedValue([
        { date: new Date('2026-12-25'), name: 'Christmas' },
      ]);

      const res = await request(app).get('/api/holidays');

      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe('Christmas');
    });

    it('should allow admin to add holiday', async () => {
      mockPrisma.holiday.findUnique.mockResolvedValue(null);
      mockPrisma.holiday.create.mockResolvedValue({
        date: new Date('2026-01-01'),
        name: 'New Year',
      });

      const res = await request(app)
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ date: '2026-01-01', name: 'New Year' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Year');
    });
  });

  describe('Leave Module', () => {
    it('should allow employee to apply for leave if balance is sufficient', async () => {
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        id: 'bal-1',
        remaining: 10,
        used: 2,
      });
      mockPrisma.leaveRequest.create.mockResolvedValue({
        id: 'lv-1',
        leave_type: 'Sick',
        status: RequestStatus.Pending,
      });

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leave_type: 'Sick',
          start_date: '2026-07-10',
          end_date: '2026-07-12',
          remarks: 'Fever',
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.leaveBalance.update).toHaveBeenCalled();
      expect(mockPrisma.leaveRequest.create).toHaveBeenCalled();
    });

    it('should fail leave application if balance is insufficient', async () => {
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        id: 'bal-1',
        remaining: 1,
        used: 2,
      });

      const res = await request(app)
        .post('/api/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leave_type: 'Sick',
          start_date: '2026-07-10',
          end_date: '2026-07-12',
          remarks: 'Fever',
        });

      expect(res.status).toBe(400); // Insufficient leave balance
    });
  });
});
