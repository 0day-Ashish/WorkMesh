import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { requireRole } from '../../../middlewares/roleMiddleware';
import { validateBody } from '../../../middlewares/validateMiddleware';
import { createLeaveSchema, leaveDecisionSchema, createLeaveBalanceSchema } from '../validators/leave.schema';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.post('/', requireRole(['employee', 'admin']), validateBody(createLeaveSchema), LeaveController.createLeaveRequest);
router.get('/me', requireRole(['employee', 'admin']), LeaveController.getMyLeaveRequests);
router.get('/balances/me', requireRole(['employee', 'admin']), LeaveController.getMyLeaveBalances);

// Admin routes
router.get('/', requireRole(['admin']), LeaveController.getAllLeaveRequests);
router.patch('/:id/decision', requireRole(['admin']), validateBody(leaveDecisionSchema), LeaveController.patchLeaveDecision);
router.post('/balances', requireRole(['admin']), validateBody(createLeaveBalanceSchema), LeaveController.addLeaveBalance);

export default router;
