import { z } from 'zod';

export const createPayrollSchema = z.object({
  employeeId: z.string().uuid({ message: 'Valid employee ID is required' }),
  month: z.number().int().min(1).max(12, { message: 'Month must be between 1 and 12' }),
  year: z.number().int().min(2000, { message: 'Valid year is required' }),
  basicSalary: z.number().min(0, { message: 'Basic salary must be positive' }),
  deductions: z.number().min(0, { message: 'Deductions must be positive' })
});
