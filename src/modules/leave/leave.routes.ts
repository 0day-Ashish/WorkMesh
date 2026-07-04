import { Router } from 'express';
import { LeaveController } from './leave.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody } from '../../middlewares/validateMiddleware';
import { createLeaveRequestSchema } from './leave.schema';

const createLeaveRouter = (): Router => {
  const router = Router();

  // Employee-only endpoints
  router.post('/', authMiddleware, requireRole(['employee']), validateBody(createLeaveRequestSchema), LeaveController.applyLeave);
  router.get('/me', authMiddleware, requireRole(['employee']), LeaveController.getOwnLeaves);

  return router;
};

export default createLeaveRouter;
