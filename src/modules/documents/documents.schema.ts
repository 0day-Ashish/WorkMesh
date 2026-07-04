import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  doc_type: z.string().trim().min(1, 'Document type is required'),
  file_url: z.string().trim().url('Invalid file URL format'),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
