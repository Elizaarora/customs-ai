import { z } from 'zod';

// Named so they're easy to find and change — not magic numbers buried in the action.
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export const UploadedFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, { message: 'File is empty' })
  .refine((file) => file.size <= MAX_UPLOAD_BYTES, {
    message: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit`,
  })
  .superRefine((file, ctx) => {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unsupported file type: ${file.type}. Allowed: PDF, PNG, JPEG`,
      });
    }
  });

export function extensionFor(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}
