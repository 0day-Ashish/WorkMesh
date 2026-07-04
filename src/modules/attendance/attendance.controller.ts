import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';
import { RequestStatus } from '@prisma/client';

export class AttendanceController {
  public static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const existingRecord = await prisma.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: req.user.employee_id,
            date: today,
          },
        },
      });

      let attendanceRecord;

      if (!existingRecord) {
        attendanceRecord = await prisma.attendance.create({
          data: {
            employee_id: req.user.employee_id,
            date: today,
            check_in: new Date(),
            status: 'Present',
          },
        });
      } else {
        if (existingRecord.check_in) {
          throw new ConflictError('Already checked in today');
        }
        attendanceRecord = await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            check_in: new Date(),
            status: 'Present',
          },
        });
      }

      res.status(200).json(attendanceRecord);
    } catch (error) {
      next(error);
    }
  }

  public static async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const existingRecord = await prisma.attendance.findUnique({
        where: {
          employee_id_date: {
            employee_id: req.user.employee_id,
            date: today,
          },
        },
      });

      if (!existingRecord) {
        throw new NotFoundError('Check-in record not found for today. Please check in first.');
      }

      const attendanceRecord = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          check_out: new Date(),
          status: 'Present',
        },
      });

      res.status(200).json(attendanceRecord);
    } catch (error) {
      next(error);
    }
  }

  public static async getOwnAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const attendance = await prisma.attendance.findMany({
        where: { employee_id: req.user.employee_id },
        orderBy: { date: 'desc' },
      });

      res.status(200).json(attendance);
    } catch (error) {
      next(error);
    }
  }

  public static async listAllAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employee_id, startDate, endDate } = req.query;

      const whereClause: any = {};

      if (employee_id) {
        whereClause.employee_id = String(employee_id);
      }

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date.gte = new Date(String(startDate));
        }
        if (endDate) {
          whereClause.date.lte = new Date(String(endDate));
        }
      }

      const attendance = await prisma.attendance.findMany({
        where: whereClause,
        include: { employee: true },
        orderBy: { date: 'desc' },
      });

      res.status(200).json(attendance);
    } catch (error) {
      next(error);
    }
  }

  public static async createRegularization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const { date, requested_check_in, requested_check_out, reason } = req.body;

      const normalizedDate = new Date(date);
      normalizedDate.setUTCHours(0, 0, 0, 0);

      const regularization = await prisma.attendanceRegularization.create({
        data: {
          employee_id: req.user.employee_id,
          date: normalizedDate,
          requested_check_in: requested_check_in ? new Date(requested_check_in) : null,
          requested_check_out: requested_check_out ? new Date(requested_check_out) : null,
          reason,
          status: RequestStatus.Pending,
        },
      });

      res.status(201).json(regularization);
    } catch (error) {
      next(error);
    }
  }

  public static async getOwnRegularizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const regularizations = await prisma.attendanceRegularization.findMany({
        where: { employee_id: req.user.employee_id },
        orderBy: { date: 'desc' },
      });

      res.status(200).json(regularizations);
    } catch (error) {
      next(error);
    }
  }

  public static async decideRegularization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const reg = await prisma.attendanceRegularization.findUnique({
        where: { id },
      });

      if (!reg) {
        throw new NotFoundError('Regularization request not found');
      }

      if (reg.status !== RequestStatus.Pending) {
        throw new BadRequestError('Regularization request has already been decided');
      }

      const updatedReg = await prisma.attendanceRegularization.update({
        where: { id },
        data: {
          status,
          reviewed_by: req.user!.id,
          reviewed_at: new Date(),
        },
      });

      if (status === RequestStatus.Approved) {
        await prisma.attendance.upsert({
          where: {
            employee_id_date: {
              employee_id: reg.employee_id,
              date: reg.date,
            },
          },
          update: {
            check_in: reg.requested_check_in,
            check_out: reg.requested_check_out,
            status: 'Present',
          },
          create: {
            employee_id: reg.employee_id,
            date: reg.date,
            check_in: reg.requested_check_in,
            check_out: reg.requested_check_out,
            status: 'Present',
          },
        });
      }

      res.status(200).json(updatedReg);
    } catch (error) {
      next(error);
    }
  }
}
