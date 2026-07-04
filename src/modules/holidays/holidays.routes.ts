import { Router } from 'express';
import { HolidaysController } from './holidays.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/roleMiddleware';
import { validateBody } from '../../middlewares/validateMiddleware';
import { createHolidaySchema } from './holidays.schema';

const createHolidaysRouter = (): Router => {
  const router = Router();

  // Public read
  router.get('/', HolidaysController.listHolidays);

  // Admin write
  router.post('/', authMiddleware, requireRole(['admin']), validateBody(createHolidaySchema), HolidaysController.createHoliday);

  return router;
};

export default createHolidaysRouter;
