import { z } from 'zod';

export const createHolidaySchema = z.object({
  date: z.string().datetime({ precision: 3 }).or(z.string().date()).transform(val => new Date(val)),
  name: z.string().trim().min(1, 'Holiday name is required'),
  region: z.string().trim().optional(),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
