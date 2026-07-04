import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody } from '../../middlewares/validateMiddleware';
import { uploadDocumentSchema } from './documents.schema';

const createDocumentsRouter = (): Router => {
  const router = Router();

  // Employee own documents endpoints (both employee and admin roles allowed)
  router.get('/me', authMiddleware, requireRole(['employee', 'admin']), DocumentsController.getOwnDocuments);
  router.post('/me', authMiddleware, requireRole(['employee', 'admin']), validateBody(uploadDocumentSchema), DocumentsController.uploadOwnDocument);

  // Administrative endpoints for any employee's documents (admin role only)
  router.get('/:employeeId', authMiddleware, requireRole(['admin']), DocumentsController.getEmployeeDocuments);
  router.post('/:employeeId', authMiddleware, requireRole(['admin']), validateBody(uploadDocumentSchema), DocumentsController.uploadEmployeeDocument);

  return router;
};

export default createDocumentsRouter;
