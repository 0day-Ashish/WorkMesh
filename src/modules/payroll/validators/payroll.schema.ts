import { z } from 'zod';

export const upsertPayrollSchema = z.object({
  month: z.number().int().min(1).max(12, { message: 'Month must be between 1 and 12' }),
  year: z.number().int().min(2000, { message: 'Valid year is required' }),
  basicSalary: z.number().min(0, { message: 'Basic salary must be positive' }),
  deductions: z.number().min(0, { message: 'Deductions must be positive' }),
});

export type UpsertPayrollInput = z.infer<typeof upsertPayrollSchema>;
