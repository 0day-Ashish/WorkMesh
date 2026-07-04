import { z } from 'zod';
import { RequestStatus } from '@prisma/client';

export const createRegularizationSchema = z.object({
  date: z.string().datetime({ precision: 3 }).or(z.string().date()).transform(val => new Date(val)),
  requested_check_in: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
  requested_check_out: z.string().datetime({ precision: 3 }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
  reason: z.string().trim().min(1, 'Reason for regularization is required'),
});

export const decisionSchema = z.object({
  status: z.enum([RequestStatus.Approved, RequestStatus.Rejected]),
});

export type CreateRegularizationInput = z.infer<typeof createRegularizationSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
