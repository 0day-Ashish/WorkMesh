import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';

export class EmployeesController {
  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const employee = await prisma.employee.findUnique({
        where: { id: req.user.employee_id },
        include: { department: true },
      });

      if (!employee) {
        throw new NotFoundError('Employee record not found');
      }

      res.status(200).json(employee);
    } catch (error) {
      next(error);
    }
  }

  public static async patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id: req.user.employee_id },
        data: req.body,
      });

      res.status(200).json(updatedEmployee);
    } catch (error) {
      next(error);
    }
  }

  public static async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await prisma.employee.findMany({
        include: { department: true },
      });
      res.status(200).json(employees);
    } catch (error) {
      next(error);
    }
  }

  public static async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employee_code, department_id } = req.body;

      const existingCode = await prisma.employee.findUnique({
        where: { employee_code },
      });

      if (existingCode) {
        throw new ConflictError('Employee code already exists');
      }

      if (department_id) {
        const dept = await prisma.department.findUnique({
          where: { id: department_id },
        });
        if (!dept) {
          throw new NotFoundError('Department not found');
        }
      }

      const newEmployee = await prisma.employee.create({
        data: req.body,
      });

      res.status(201).json(newEmployee);
    } catch (error) {
      next(error);
    }
  }

  public static async getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          department: true,
          user: {
            select: {
              email: true,
              role: true,
              email_verified: true,
            },
          },
        },
      });

      if (!employee) {
        throw new NotFoundError('Employee not found');
      }

      res.status(200).json(employee);
    } catch (error) {
      next(error);
    }
  }

  public static async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { employee_code, department_id } = req.body;

      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new NotFoundError('Employee not found');
      }

      if (employee_code && employee_code !== employee.employee_code) {
        const existingCode = await prisma.employee.findUnique({
          where: { employee_code },
        });
        if (existingCode) {
          throw new ConflictError('Employee code already exists');
        }
      }

      if (department_id) {
        const dept = await prisma.department.findUnique({
          where: { id: department_id },
        });
        if (!dept) {
          throw new NotFoundError('Department not found');
        }
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: req.body,
      });

      res.status(200).json(updatedEmployee);
    } catch (error) {
      next(error);
    }
  }
}
