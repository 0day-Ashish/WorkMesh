import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required'),
  manager_id: z.string().uuid().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  manager_id: z.string().uuid().optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
