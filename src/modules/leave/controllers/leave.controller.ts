import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';

export class LeaveController {
  public static async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user?.employee_id;
      if (!employeeId) {
        return res.status(403).json({ message: 'User is not linked to an employee profile' });
      }

      const { fromDate, toDate, leaveType, reason } = req.body;
      const request = await LeaveService.createLeaveRequest(employeeId, {
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        leaveType,
        reason
      });

      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user?.employee_id;
      if (!employeeId) {
        return res.status(403).json({ message: 'User is not linked to an employee profile' });
      }

      const requests = await LeaveService.getEmployeeLeaveRequests(employeeId);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyLeaveBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user?.employee_id;
      if (!employeeId) {
        return res.status(403).json({ message: 'User is not linked to an employee profile' });
      }

      const balances = await LeaveService.getEmployeeLeaveBalances(employeeId);
      res.status(200).json(balances);
    } catch (error) {
      next(error);
    }
  }

  public static async getAllLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await LeaveService.getAllLeaveRequests();
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  public static async patchLeaveDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedRequest = await LeaveService.patchLeaveDecision(id, status);
      res.status(200).json(updatedRequest);
    } catch (error) {
      next(error);
    }
  }

  public static async addLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, leaveType, total } = req.body;
      const balance = await LeaveService.createOrUpdateLeaveBalance(employeeId, leaveType, total);
      res.status(200).json(balance);
    } catch (error) {
      next(error);
    }
  }
}
