import { Router } from 'express';
import { DepartmentsController } from './departments.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody, validateParams } from '../../middlewares/validateMiddleware';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema';
import { idParamSchema } from '../../utils/paramSchemas';

const createDepartmentsRouter = (): Router => {
  const router = Router();

  // All department endpoints are Admin only
  router.get('/', authMiddleware, requireRole(['admin']), DepartmentsController.listDepartments);
  router.post('/', authMiddleware, requireRole(['admin']), validateBody(createDepartmentSchema), DepartmentsController.createDepartment);
  router.put('/:id', authMiddleware, requireRole(['admin']), validateParams(idParamSchema), validateBody(updateDepartmentSchema), DepartmentsController.updateDepartment);
  router.delete('/:id', authMiddleware, requireRole(['admin']), validateParams(idParamSchema), DepartmentsController.deleteDepartment);

  return router;
};

export default createDepartmentsRouter;
