import { Router } from 'express';
import { EmployeesController } from './employees.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody, validateParams } from '../../middlewares/validateMiddleware';
import { createEmployeeSchema, updateEmployeeSchema, patchMeSchema } from './employees.schema';
import { idParamSchema } from '../../utils/paramSchemas';

const createEmployeesRouter = (): Router => {
  const router = Router();

  // Employee self-endpoints (Accessible by both employee and admin)
  router.get('/me', authMiddleware, requireRole(['employee', 'admin']), EmployeesController.getMe);
  router.patch('/me', authMiddleware, requireRole(['employee', 'admin']), validateBody(patchMeSchema), EmployeesController.patchMe);

  // Administrative endpoints (Admin only)
  router.get('/', authMiddleware, requireRole(['admin']), EmployeesController.listEmployees);
  router.post('/', authMiddleware, requireRole(['admin']), validateBody(createEmployeeSchema), EmployeesController.createEmployee);
  router.get('/:id', authMiddleware, requireRole(['admin']), validateParams(idParamSchema), EmployeesController.getEmployeeById);
  router.put('/:id', authMiddleware, requireRole(['admin']), validateParams(idParamSchema), validateBody(updateEmployeeSchema), EmployeesController.updateEmployee);

  return router;
};

export default createEmployeesRouter;
