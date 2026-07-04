import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../services/payroll.service';

export class PayrollController {
  public static async getMyPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user?.employee_id;
      if (!employeeId) {
        return res.status(403).json({ message: 'User is not linked to an employee profile' });
      }

      const payroll = await PayrollService.getEmployeePayroll(employeeId);
      res.status(200).json(payroll);
    } catch (error) {
      next(error);
    }
  }

  public static async getEmployeePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const payroll = await PayrollService.getEmployeePayroll(employeeId);
      res.status(200).json(payroll);
    } catch (error) {
      next(error);
    }
  }

  public static async createPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, month, year, basicSalary, deductions } = req.body;
      const payroll = await PayrollService.createPayroll({ employeeId, month, year, basicSalary, deductions });
      res.status(201).json(payroll);
    } catch (error) {
      next(error);
    }
  }
}
