import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { upload } from '../../middlewares/upload.middleware';
import { validateParams } from '../../middlewares/validateMiddleware';
import { employeeIdParamSchema } from '../../utils/paramSchemas';

const createDocumentsRouter = (): Router => {
  const router = Router();

  // Employee own documents endpoints (both employee and admin roles allowed)
  router.get('/me', authMiddleware, requireRole(['employee', 'admin']), DocumentsController.getOwnDocuments);
  router.post('/me', authMiddleware, requireRole(['employee', 'admin']), upload.single('file'), DocumentsController.uploadOwnDocument);

  // Secure file retrieval route
  router.get('/files/:filename', authMiddleware, DocumentsController.serveDocumentFile);

  // Administrative endpoints for any employee's documents (admin role only)
  router.get('/:employeeId', authMiddleware, requireRole(['admin']), validateParams(employeeIdParamSchema), DocumentsController.getEmployeeDocuments);
  router.post('/:employeeId', authMiddleware, requireRole(['admin']), validateParams(employeeIdParamSchema), upload.single('file'), DocumentsController.uploadEmployeeDocument);

  return router;
};

export default createDocumentsRouter;
