import { Router } from 'express';
import { PayrollController } from '../controllers/payroll.controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { requireRole } from '../../../middlewares/roleMiddleware';
import { validateBody, validateParams } from '../../../middlewares/validateMiddleware';
import { upsertPayrollSchema } from '../validators/payroll.schema';
import { employeeIdParamSchema } from '../../../utils/paramSchemas';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Employee routes
router.get('/me', requireRole(['employee', 'admin']), PayrollController.getMyPayroll);

// Admin routes
router.get('/:employeeId', requireRole(['admin']), validateParams(employeeIdParamSchema), PayrollController.getEmployeePayroll);
router.put('/:employeeId', requireRole(['admin']), validateParams(employeeIdParamSchema), validateBody(upsertPayrollSchema), PayrollController.upsertPayroll);

export default router;
