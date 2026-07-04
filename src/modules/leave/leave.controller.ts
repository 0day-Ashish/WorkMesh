import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { RequestStatus } from '@prisma/client';

export class LeaveController {
  public static async applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const { leave_type, start_date, end_date, remarks } = req.body;

      const dStart = new Date(start_date);
      dStart.setUTCHours(0, 0, 0, 0);

      const dEnd = new Date(end_date);
      dEnd.setUTCHours(0, 0, 0, 0);

      if (dStart > dEnd) {
        throw new BadRequestError('Start date must be before or equal to end date');
      }

      const diffTime = dEnd.getTime() - dStart.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const year = dStart.getUTCFullYear();

      const result = await prisma.$transaction(async (tx) => {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employee_id_leave_type_year: {
              employee_id: req.user!.employee_id!,
              leave_type,
              year,
            },
          },
        });

        if (!balance) {
          throw new BadRequestError(`No leave balance found for type '${leave_type}' in year ${year}`);
        }

        if (balance.remaining < diffDays) {
          throw new BadRequestError(
            `Insufficient leave balance. Remaining: ${balance.remaining}, Requested: ${diffDays}`
          );
        }

        // Deduct balance and create request
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            remaining: balance.remaining - diffDays,
            used: balance.used + diffDays,
          },
        });

        const leaveRequest = await tx.leaveRequest.create({
          data: {
            employee_id: req.user!.employee_id!,
            leave_type,
            start_date: dStart,
            end_date: dEnd,
            remarks,
            status: RequestStatus.Pending,
          },
        });

        return leaveRequest;
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getOwnLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const leaves = await prisma.leaveRequest.findMany({
        where: { employee_id: req.user.employee_id },
        orderBy: { start_date: 'desc' },
      });

      res.status(200).json(leaves);
    } catch (error) {
      next(error);
    }
  }
}
