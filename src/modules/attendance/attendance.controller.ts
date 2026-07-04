import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { RequestStatus } from '@prisma/client';

export class AttendanceController {
  private static deriveStatus(checkIn: Date, checkOut?: Date): string {
    if (!checkOut) {
      return 'Half-day';
    }
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 8 ? 'Present' : 'Half-day';
  }

  private static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }

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
            status: 'Half-day', // default until checkout
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
            status: 'Half-day',
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

      const existingRecord = await prisma.attendance.findFirst({
        where: {
          employee_id: req.user.employee_id,
          check_out: null,
        },
        orderBy: { date: 'desc' },
      });

      if (!existingRecord || !existingRecord.check_in) {
        throw new NotFoundError('No active check-in session found. Please check in first.');
      }

      const checkoutTime = new Date();
      const derivedStatus = AttendanceController.deriveStatus(existingRecord.check_in, checkoutTime);

      const attendanceRecord = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          check_out: checkoutTime,
          status: derivedStatus,
        },
      });

      res.status(200).json(attendanceRecord);
    } catch (error) {
      next(error);
    }
  }

  // GET /attendance/me (Employee views own attendance calendar)
  public static async getOwnAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        // Return raw list ordered by date desc if no range query provided
        const attendance = await prisma.attendance.findMany({
          where: { employee_id: req.user.employee_id },
          orderBy: { date: 'desc' },
        });
        res.status(200).json(attendance);
        return;
      }

      const start = new Date(String(startDate));
      const end = new Date(String(endDate));

      // 1. Fetch check-in/out records
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employee_id: req.user.employee_id,
          date: { gte: start, lte: end },
        },
      });

      // 2. Fetch approved leaves in range
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employee_id: req.user.employee_id,
          status: RequestStatus.Approved,
          OR: [
            { from_date: { lte: end }, to_date: { gte: start } },
          ],
        },
      });

      // 3. Fetch holidays in range
      const holidays = await prisma.holiday.findMany({
        where: {
          date: { gte: start, lte: end },
        },
      });

      // 4. Build daily calendar mapping
      const result: any[] = [];
      const tempDate = new Date(start);

      while (tempDate <= end) {
        const currentDateStr = tempDate.toISOString().split('T')[0];
        const currentDate = new Date(tempDate);

        // Find attendance row
        const att = attendanceRecords.find(
          (a) => a.date.toISOString().split('T')[0] === currentDateStr
        );

        if (att) {
          result.push({
            date: currentDateStr,
            check_in: att.check_in,
            check_out: att.check_out,
            status: att.status,
          });
        } else {
          // Check approved leaves
          const isOnLeave = approvedLeaves.some(
            (l) => currentDate >= l.from_date && currentDate <= l.to_date
          );

          // Check holidays
          const holiday = holidays.find(
            (h) => h.date.toISOString().split('T')[0] === currentDateStr
          );

          let status = 'Absent';
          if (isOnLeave) {
            status = 'Leave';
          } else if (holiday) {
            status = `Holiday: ${holiday.name}`;
          } else if (AttendanceController.isWeekend(currentDate)) {
            status = 'Weekend';
          }

          result.push({
            date: currentDateStr,
            check_in: null,
            check_out: null,
            status,
          });
        }

        tempDate.setDate(tempDate.getDate() + 1);
      }

      res.status(200).json(result);
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

      await prisma.$transaction(async (tx) => {
        // 1. Update status
        await tx.attendanceRegularization.update({
          where: { id },
          data: {
            status,
            reviewed_by: req.user!.id,
            reviewed_at: new Date(),
          },
        });

        // 2. If approved, update or create the attendance row
        if (status === RequestStatus.Approved) {
          const checkIn = reg.requested_check_in || new Date(reg.date);
          const checkOut = reg.requested_check_out || undefined;
          const derivedStatus = AttendanceController.deriveStatus(checkIn, checkOut);

          await tx.attendance.upsert({
            where: {
              employee_id_date: {
                employee_id: reg.employee_id,
                date: reg.date,
              },
            },
            update: {
              check_in: reg.requested_check_in,
              check_out: reg.requested_check_out,
              status: derivedStatus,
            },
            create: {
              employee_id: reg.employee_id,
              date: reg.date,
              check_in: reg.requested_check_in,
              check_out: reg.requested_check_out,
              status: derivedStatus,
            },
          });
        }
      });

      res.status(200).json({ message: `Regularization request has been successfully resolved.` });
    } catch (error) {
      next(error);
    }
  }
}
