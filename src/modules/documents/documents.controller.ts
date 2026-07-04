import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class DocumentsController {
  public static async getOwnDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const docs = await prisma.document.findMany({
        where: { employee_id: req.user.employee_id },
      });

      res.status(200).json(docs);
    } catch (error) {
      next(error);
    }
  }

  public static async uploadOwnDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new NotFoundError('Employee record not found for this user');
      }

      const { doc_type, file_url } = req.body;

      const newDoc = await prisma.document.create({
        data: {
          employee_id: req.user.employee_id,
          doc_type,
          file_url,
          uploaded_by: req.user.id,
        },
      });

      res.status(201).json(newDoc);
    } catch (error) {
      next(error);
    }
  }

  public static async getEmployeeDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundError('Employee not found');
      }

      const docs = await prisma.document.findMany({
        where: { employee_id: employeeId },
      });

      res.status(200).json(docs);
    } catch (error) {
      next(error);
    }
  }

  public static async uploadEmployeeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { doc_type, file_url } = req.body;

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundError('Employee not found');
      }

      const newDoc = await prisma.document.create({
        data: {
          employee_id: employeeId,
          doc_type,
          file_url,
          uploaded_by: req.user!.id,
        },
      });

      res.status(201).json(newDoc);
    } catch (error) {
      next(error);
    }
  }
}
