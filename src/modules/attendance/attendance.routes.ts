import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody } from '../../middlewares/validateMiddleware';
import { createRegularizationSchema, decisionSchema } from './attendance.schema';

const createAttendanceRouter = (): Router => {
  const router = Router();

  // Employee-only endpoints
  router.post('/checkin', authMiddleware, requireRole(['employee']), AttendanceController.checkIn);
  router.post('/checkout', authMiddleware, requireRole(['employee']), AttendanceController.checkOut);
  router.get('/me', authMiddleware, requireRole(['employee']), AttendanceController.getOwnAttendance);
  router.post('/regularizations', authMiddleware, requireRole(['employee']), validateBody(createRegularizationSchema), AttendanceController.createRegularization);
  router.get('/regularizations', authMiddleware, requireRole(['employee']), AttendanceController.getOwnRegularizations);

  // Administrative endpoints
  router.get('/', authMiddleware, requireRole(['admin']), AttendanceController.listAllAttendance);
  router.patch('/regularizations/:id/decision', authMiddleware, requireRole(['admin']), validateBody(decisionSchema), AttendanceController.decideRegularization);

  return router;
};

export default createAttendanceRouter;
