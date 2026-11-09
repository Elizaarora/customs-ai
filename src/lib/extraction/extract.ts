import 'server-only';
import { z } from 'zod';
import { ApiError, GoogleGenAI } from '@google/genai';
import { db } from '../../prisma/db';
import { readFile } from '../storage/storage';
import { mimeTypeFromFilePath } from '../documents/mime-type';
import { runChecksForShipment } from '../run-checks-for-shipment';
import { ExtractionResultSchema } from './schemas';
import { DOCUMENT_TYPES_WITH_LINE_ITEMS, EXPECTED_FIELDS } from './field-config';
import type { Models } from '../../prisma/contract.d';

const MODEL_ID = 'gemini-3.6-flash';
const CONFIDENCE_THRESHOLD = 0.8;
const RESPONSE_SCHEMA = z.toJSONSchema(ExtractionResultSchema);

// 'document' content parts (PDF input) only exist in v1beta — the SDK
// defaults to the stable v1 API, which rejects them.
const client = new GoogleGenAI({ httpOptions: { apiVersion: 'v1beta' } });

function buildPrompt(type: Models.public_Document['type'], fieldNames: string[], wantsLineItems: boolean) {
  const lineItemNote = wantsLineItems
    ? ' Also extract every line item (description, hsn code, quantity, unitPrice, lineTotal), each with its own confidence. Set hsn to null if it is not printed on the document.'
    : '';
  return (
    `This is a ${type.replace('_', ' ').toLowerCase()}. Extract these fields: ${fieldNames.join(', ')}.` +
    ` For each field give its value as a string and a confidence from 0 to 1.${lineItemNote}` +
    ' If a field is not present on the document, omit it rather than guessing.'
  );
}

function contentPartFor(bytes: Buffer, mimeType: string) {
  const data = bytes.toString('base64');
  if (mimeType === 'application/pdf') {
    return { type: 'document' as const, data, mime_type: mimeType };
  }
  return { type: 'image' as const, data, mime_type: mimeType };
}

function statusFor(confidence: number) {
  return confidence >= CONFIDENCE_THRESHOLD ? 'AUTO' : 'NEEDS_REVIEW';
}

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Gemini rate limit hit — try again in a minute.';
  }
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return 'Unknown extraction error';
}

// Reads the uploaded file, asks Gemini to extract fields, and writes the
// result. Never throws — any failure (API error, malformed output, unreadable
// file) is recorded as a FAILED document so it falls through to manual entry.
// Hard rule #3.
export async function extractDocument(documentId: number): Promise<void> {
  await db.orm.public.Document.where({ id: documentId }).update({ extractionStatus: 'PROCESSING' });

  const document = await db.orm.public.Document.first({ id: documentId });
  if (!document) return;

  try {
    const bytes = await readFile(document.filePath);
    const fieldNames = EXPECTED_FIELDS[document.type];
    const wantsLineItems = DOCUMENT_TYPES_WITH_LINE_ITEMS.includes(document.type);

    const interaction = await client.interactions.create({
      model: MODEL_ID,
      input: [
        { type: 'text', text: buildPrompt(document.type, fieldNames, wantsLineItems) },
        contentPartFor(bytes, mimeTypeFromFilePath(document.filePath)),
      ],
      response_format: { type: 'text', mime_type: 'application/json', schema: RESPONSE_SCHEMA },
    });

    if (!interaction.output_text) {
      throw new Error('Gemini returned an empty response');
    }
    const result = ExtractionResultSchema.parse(JSON.parse(interaction.output_text));

    await db.transaction(async (tx) => {
      for (const field of result.fields) {
        await tx.orm.public.ExtractedField.upsert({
          create: {
            documentId,
            name: field.name,
            value: field.value,
            confidence: field.confidence,
            status: statusFor(field.confidence),
          },
          update: {
            value: field.value,
            confidence: field.confidence,
            status: statusFor(field.confidence),
          },
        });
      }

      // LineItem has no natural unique key to upsert on, so clear old ones
      // first — otherwise re-extracting (e.g. after a re-upload) would pile
      // up duplicates alongside the new rows.
      await tx.orm.public.LineItem.where({ documentId }).deleteAll();

      for (const item of result.lineItems) {
        await tx.orm.public.LineItem.create({
          documentId,
          description: item.description,
          hsn: item.hsn,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          confidence: item.confidence,
          status: statusFor(item.confidence),
        });
      }

      await tx.orm.public.Document.where({ id: documentId }).update({ extractionStatus: 'SUCCEEDED' });
    });

    // Re-run cross-checks now that this document's fields exist. Still
    // CANNOT_CHECK for any checks whose other documents aren't uploaded yet.
    await runChecksForShipment(document.shipmentId);
  } catch (error) {
    await db.orm.public.Document.where({ id: documentId }).update({
      extractionStatus: 'FAILED',
      extractionError: describeError(error),
    });
  }
}
