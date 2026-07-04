import prisma from '../../../config/db';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { RequestStatus } from '@prisma/client';

export class LeaveService {
  public static async createLeaveRequest(employeeId: string, data: { fromDate: Date, toDate: Date, leaveType: string, reason: string }) {
    if (data.fromDate > data.toDate) {
      throw new BadRequestError('fromDate must be less than or equal to toDate');
    }
    
    return prisma.leaveRequest.create({
      data: {
        employee_id: employeeId,
        from_date: data.fromDate,
        to_date: data.toDate,
        leave_type: data.leaveType,
        reason: data.reason
      }
    });
  }
  
  public static async getEmployeeLeaveRequests(employeeId: string) {
    return prisma.leaveRequest.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: 'desc' }
    });
  }
  
  public static async getEmployeeLeaveBalances(employeeId: string) {
    return prisma.leaveBalance.findMany({
      where: { employee_id: employeeId }
    });
  }
  
  public static async getAllLeaveRequests() {
    return prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { full_name: true, employee_code: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }
  
  public static async patchLeaveDecision(id: string, status: RequestStatus) {
    if (status !== 'Approved') {
      return prisma.leaveRequest.update({
        where: { id },
        data: { status }
      });
    }

    return await prisma.$transaction(async (tx) => {
      const leaveReq = await tx.leaveRequest.findUnique({
        where: { id }
      });
      
      if (!leaveReq) {
        throw new NotFoundError('Leave request not found');
      }
      
      if (leaveReq.status === 'Approved') {
        throw new BadRequestError('Leave is already approved');
      }

      // Calculate days
      const days = Math.ceil((leaveReq.to_date.getTime() - leaveReq.from_date.getTime()) / (1000 * 3600 * 24)) + 1;
      
      const updatedReq = await tx.leaveRequest.update({
        where: { id },
        data: { status: 'Approved' }
      });
      
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employee_id_leave_type: {
            employee_id: leaveReq.employee_id,
            leave_type: leaveReq.leave_type
          }
        }
      });
      
      if (!balance) {
        throw new BadRequestError(`Leave balance for ${leaveReq.leave_type} not found`);
      }
      
      if (balance.remaining < days) {
        throw new BadRequestError('Insufficient leave balance');
      }
      
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          remaining: balance.remaining - days,
          used: balance.used + days
        }
      });
      
      const dates = [];
      let current = new Date(leaveReq.from_date);
      while (current <= leaveReq.to_date) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      for (const date of dates) {
        await tx.attendance.upsert({
          where: {
            employee_id_date: {
              employee_id: leaveReq.employee_id,
              date: date
            }
          },
          update: { status: 'Leave' },
          create: {
            employee_id: leaveReq.employee_id,
            date: date,
            status: 'Leave'
          }
        });
      }
      
      return updatedReq;
    });
  }

  public static async createOrUpdateLeaveBalance(employeeId: string, leaveType: string, total: number) {
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        employee_id_leave_type: { employee_id: employeeId, leave_type: leaveType }
      }
    });

    if (existing) {
      return prisma.leaveBalance.update({
        where: { id: existing.id },
        data: {
          total,
          remaining: total - existing.used
        }
      });
    }

    return prisma.leaveBalance.create({
      data: {
        employee_id: employeeId,
        leave_type: leaveType,
        total,
        remaining: total,
        used: 0
      }
    });
  }
}
