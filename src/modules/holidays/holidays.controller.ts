import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class HolidaysController {
  public static async listHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holidays = await prisma.holiday.findMany({
        orderBy: { date: 'asc' },
      });
      res.status(200).json(holidays);
    } catch (error) {
      next(error);
    }
  }

  public static async createHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, name, region } = req.body;

      const normalizedDate = new Date(date);
      normalizedDate.setUTCHours(0, 0, 0, 0);

      const existingHoliday = await prisma.holiday.findUnique({
        where: { date: normalizedDate },
      });

      if (existingHoliday) {
        throw new ConflictError('A holiday is already scheduled for this date');
      }

      const newHoliday = await prisma.holiday.create({
        data: {
          date: normalizedDate,
          name,
          region,
        },
      });

      res.status(201).json(newHoliday);
    } catch (error) {
      next(error);
    }
  }
}
