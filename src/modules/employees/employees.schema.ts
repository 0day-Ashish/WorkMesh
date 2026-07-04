import { z } from 'zod';
import { EmployeeStatus } from '@prisma/client';

export const createEmployeeSchema = z.object({
  employee_code: z.string().trim().min(1, 'Employee code is required'),
  full_name: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  joining_date: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
  status: z.nativeEnum(EmployeeStatus).optional(),
  department_id: z.string().uuid().optional(),
});

export const updateEmployeeSchema = z.object({
  employee_code: z.string().trim().min(1).optional(),
  full_name: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  joining_date: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
  status: z.nativeEnum(EmployeeStatus).optional(),
  department_id: z.string().uuid().optional(),
});

export const patchMeSchema = z.object({
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type PatchMeInput = z.infer<typeof patchMeSchema>;
