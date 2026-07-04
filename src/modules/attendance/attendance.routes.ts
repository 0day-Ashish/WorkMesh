import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody, validateParams } from '../../middlewares/validateMiddleware';
import { createRegularizationSchema, decisionSchema } from './attendance.schema';
import { idParamSchema } from '../../utils/paramSchemas';

const createAttendanceRouter = (): Router => {
  const router = Router();

  // Employee-only / Self-service endpoints (Accessible by both employee and admin for their own accounts)
  router.post('/checkin', authMiddleware, requireRole(['employee', 'admin']), AttendanceController.checkIn);
  router.post('/checkout', authMiddleware, requireRole(['employee', 'admin']), AttendanceController.checkOut);
  router.get('/me', authMiddleware, requireRole(['employee', 'admin']), AttendanceController.getOwnAttendance);
  router.post('/regularizations', authMiddleware, requireRole(['employee', 'admin']), validateBody(createRegularizationSchema), AttendanceController.createRegularization);
  router.get('/regularizations', authMiddleware, requireRole(['employee', 'admin']), AttendanceController.getOwnRegularizations);

  // Administrative endpoints
  router.get('/', authMiddleware, requireRole(['admin']), AttendanceController.listAllAttendance);
  router.patch('/regularizations/:id/decision', authMiddleware, requireRole(['admin']), validateParams(idParamSchema), validateBody(decisionSchema), AttendanceController.decideRegularization);

  return router;
};

export default createAttendanceRouter;
