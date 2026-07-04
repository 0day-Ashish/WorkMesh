import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../../config/db';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { UPLOAD_DIR } from '../../middlewares/upload.middleware';

export class DocumentsController {
  // GET /documents/me
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

  // POST /documents/me
  public static async uploadOwnDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.employee_id) {
        throw new ForbiddenError('Employee record not found for this user');
      }

      let file_url = req.body.file_url;
      if (req.file) {
        file_url = req.file.filename;
      }

      if (!file_url) {
        throw new BadRequestError('File is required');
      }

      const { doc_type } = req.body;
      if (!doc_type) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up file if validation fails
        throw new BadRequestError('doc_type is required');
      }

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

  // GET /documents/:employeeId (Admin view)
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

  // POST /documents/:employeeId (Admin upload)
  public static async uploadEmployeeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { doc_type } = req.body;

      let file_url = req.body.file_url;
      if (req.file) {
        file_url = req.file.filename;
      }

      if (!file_url) {
        throw new BadRequestError('File is required');
      }

      if (!doc_type) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up file if validation fails
        throw new BadRequestError('doc_type is required');
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up file
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

  // GET /documents/files/:filename (Secure serving)
  public static async serveDocumentFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;

      if (!req.user) {
        throw new ForbiddenError('Access denied');
      }

      // Find the document record to verify access rights
      const doc = await prisma.document.findFirst({
        where: { file_url: filename },
      });

      if (!doc) {
        throw new NotFoundError('Document record not found');
      }

      // Check permission: Admin can see anything. Employee can only see their own document.
      if (req.user.role !== 'admin' && doc.employee_id !== req.user.employee_id) {
        throw new ForbiddenError('You do not have permission to access this document');
      }

      const filePath = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError('Document file not found on disk');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
