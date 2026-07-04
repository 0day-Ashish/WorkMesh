import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  leave_type: z.string().trim().min(1, 'Leave type is required'),
  start_date: z.string().datetime({ precision: 3 }).or(z.string().date()).transform(val => new Date(val)),
  end_date: z.string().datetime({ precision: 3 }).or(z.string().date()).transform(val => new Date(val)),
  remarks: z.string().trim().optional(),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
