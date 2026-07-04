import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { requireRole } from '../../../middlewares/roleMiddleware';
import { validateBody } from '../../../middlewares/validateMiddleware';
import { createPayrollSchema } from '../validators/payroll.schema';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/me', requireRole(['employee', 'admin']), PayrollController.getMyPayroll);

// Admin routes
router.get('/:employeeId', requireRole(['admin']), PayrollController.getEmployeePayroll);
router.post('/', requireRole(['admin']), validateBody(createPayrollSchema), PayrollController.createPayroll);

export default router;
