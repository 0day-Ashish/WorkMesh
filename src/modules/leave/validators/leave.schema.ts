import { z } from 'zod';

export const createLeaveSchema = z.object({
  fromDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid ISO date" }),
  toDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid ISO date" }),
  leaveType: z.enum(['Casual', 'Sick', 'Earned'], { errorMap: () => ({ message: 'Leave type must be Casual, Sick, or Earned' }) }),
  reason: z.string().min(1, { message: 'Reason is required' }),
}).refine(data => new Date(data.fromDate) <= new Date(data.toDate), {
  message: "fromDate must be less than or equal to toDate",
  path: ["fromDate"]
});

export const leaveDecisionSchema = z.object({
  status: z.enum(['Approved', 'Rejected'], { errorMap: () => ({ message: 'Status must be Approved or Rejected' }) }),
});

export const createLeaveBalanceSchema = z.object({
  employeeId: z.string().uuid({ message: 'Valid employee ID is required' }),
  leaveType: z.enum(['Casual', 'Sick', 'Earned'], { errorMap: () => ({ message: 'Leave type must be Casual, Sick, or Earned' }) }),
  total: z.number().int().min(0, { message: 'Total must be a positive integer' })
});
