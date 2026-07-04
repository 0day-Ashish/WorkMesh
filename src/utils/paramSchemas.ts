import { z } from 'zod';

// Reusable UUID param schemas for route validation
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const employeeIdParamSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID format'),
});
