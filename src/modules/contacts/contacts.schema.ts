import { z } from "zod";

export const createContactSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Invalid email address"),
  message: z.string().trim().min(1, "Message content is required"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
