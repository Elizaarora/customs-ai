import { z } from 'zod';
import { requireRole } from '../../../../../src/lib/auth';
import { db } from '../../../../../src/prisma/db';
import { readFile } from '../../../../../src/lib/storage/storage';
import { mimeTypeFromFilePath } from '../../../../../src/lib/documents/mime-type';
import { parseShipmentId } from '../../../../../src/lib/shipments/shipment-id';

const DocumentTypeSchema = z.enum(['INVOICE', 'PACKING_LIST', 'BILL_OF_LADING']);

// Serves an uploaded file inline for the review screen's document viewer.
// Files live outside the public directory on purpose, so this route (behind
// requireRole) is the only way to read one back.
export async function GET(_request: Request, { params }: RouteContext<'/shipments/[id]/documents/[type]'>) {
  await requireRole(['EXECUTIVE', 'MANAGER']);

  const { id, type: rawType } = await params;
  const shipmentId = parseShipmentId(id);
  const parsedType = DocumentTypeSchema.safeParse(rawType);
  if (shipmentId === null || !parsedType.success) {
    return new Response('Not found', { status: 404 });
  }

  const document = await db.orm.public.Document.where({ shipmentId, type: parsedType.data })
    .select('filePath')
    .first();

  if (!document) {
    return new Response('Not found', { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(document.filePath);
  } catch {
    // Most commonly: the file was uploaded under a different storage driver
    // than the one currently configured (e.g. disk in dev, Supabase in
    // prod) — a missing file, not a crash.
    return new Response('File not found in storage', { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': mimeTypeFromFilePath(document.filePath),
      'Content-Disposition': 'inline',
    },
  });
}
