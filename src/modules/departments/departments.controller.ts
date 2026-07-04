import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors';

export class DepartmentsController {
  public static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await prisma.department.findMany({
        include: { manager: true },
      });
      res.status(200).json(departments);
    } catch (error) {
      next(error);
    }
  }

  public static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, manager_id } = req.body;

      const existingName = await prisma.department.findUnique({
        where: { name },
      });

      if (existingName) {
        throw new ConflictError('Department name already exists');
      }

      if (manager_id) {
        const manager = await prisma.employee.findUnique({
          where: { id: manager_id },
        });
        if (!manager) {
          throw new NotFoundError('Manager employee not found');
        }
      }

      const newDept = await prisma.department.create({
        data: req.body,
      });

      res.status(201).json(newDept);
    } catch (error) {
      next(error);
    }
  }

  public static async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, manager_id } = req.body;

      const dept = await prisma.department.findUnique({
        where: { id },
      });

      if (!dept) {
        throw new NotFoundError('Department not found');
      }

      if (name && name !== dept.name) {
        const existingName = await prisma.department.findUnique({
          where: { name },
        });
        if (existingName) {
          throw new ConflictError('Department name already exists');
        }
      }

      if (manager_id) {
        const manager = await prisma.employee.findUnique({
          where: { id: manager_id },
        });
        if (!manager) {
          throw new NotFoundError('Manager employee not found');
        }
      }

      const updatedDept = await prisma.department.update({
        where: { id },
        data: req.body,
      });

      res.status(200).json(updatedDept);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const dept = await prisma.department.findUnique({
        where: { id },
      });

      if (!dept) {
        throw new NotFoundError('Department not found');
      }

      // Safe deletion: nullify employee links in transaction
      await prisma.$transaction([
        prisma.employee.updateMany({
          where: { department_id: id },
          data: { department_id: null },
        }),
        prisma.department.delete({
          where: { id },
        }),
      ]);

      res.status(200).json({ message: 'Department successfully deleted' });
    } catch (error) {
      next(error);
    }
  }
}
