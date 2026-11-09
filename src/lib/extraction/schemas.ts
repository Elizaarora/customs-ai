import { z } from 'zod';

// What we ask Gemini to return, and what we validate its response against —
// hard rule #3: all AI output is validated with Zod.
export const ExtractionResultSchema = z.object({
  fields: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        hsn: z.string().nullable().default(null),
        quantity: z.number(),
        unitPrice: z.number(),
        lineTotal: z.number(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
