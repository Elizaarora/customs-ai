'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '../../../src/lib/auth';
import { db } from '../../../src/prisma/db';
import { saveFile } from '../../../src/lib/storage/storage';
import { extractDocument } from '../../../src/lib/extraction/extract';
import { extensionFor, UploadedFileSchema } from '../../../src/lib/documents/upload-validation';
import { gatherExportGateInput } from '../../../src/lib/export/export-gate';
import { evaluateExportGate } from '../../../src/lib/export/evaluate-gate';
import type { Models } from '../../../src/prisma/contract.d';

type DocumentType = Models.public_Document['type'];

export async function uploadDocument(shipmentId: number, type: DocumentType, formData: FormData) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const file = UploadedFileSchema.parse(formData.get('file'));
  const bytes = Buffer.from(await file.arrayBuffer());
  const relativePath = `${shipmentId}/${type}.${extensionFor(file.type)}`;
  await saveFile(bytes, relativePath);

  const document = await db.orm.public.Document.upsert({
    conflictOn: { shipmentId, type },
    create: {
      shipmentId,
      type,
      filePath: relativePath,
      uploadedById: user.id,
      extractionStatus: 'PENDING',
    },
    update: {
      filePath: relativePath,
      uploadedById: user.id,
      extractionStatus: 'PENDING',
      extractionError: null,
    },
  });

  // Synchronous on purpose — this is a low-volume internal tool, no job queue needed.
  await extractDocument(document.id);

  // redirect() to the exact page we're already on doesn't by itself bust the
  // client Router Cache, so without this the badge/status wouldn't update
  // until a manual refresh.
  revalidatePath(`/shipments/${shipmentId}`);
  redirect(`/shipments/${shipmentId}`);
}

// Only a manager can approve, and only once the rest of the gate is already
// clear — approving isn't itself a gate condition the manager can override.
export async function approveShipment(shipmentId: number) {
  const user = await requireRole(['MANAGER']);

  const input = await gatherExportGateInput(shipmentId);
  if (!input) {
    throw new Error('Shipment not found');
  }

  // hasApproval: true suppresses the "not approved" reason, leaving only the
  // three conditions a manager can't override by approving.
  const { allowed, reasons } = evaluateExportGate({ ...input, hasApproval: true });
  if (!allowed) {
    throw new Error(`Cannot approve yet: ${reasons.join('; ')}`);
  }

  await db.orm.public.Approval.create({ shipmentId, approvedById: user.id, decision: 'APPROVED' });

  revalidatePath(`/shipments/${shipmentId}`);
  redirect(`/shipments/${shipmentId}`);
}

const SendBackCommentSchema = z.string().trim().min(1, 'A comment is required to send a shipment back');

// Unlike approving, a manager can send a shipment back at any point in its
// review — it's a flag for the team, not something gated on the review being
// otherwise complete.
export async function sendBackShipment(shipmentId: number, formData: FormData) {
  const user = await requireRole(['MANAGER']);

  const comment = SendBackCommentSchema.parse(formData.get('comment'));

  await db.orm.public.Approval.create({
    shipmentId,
    approvedById: user.id,
    decision: 'SENT_BACK',
    comment,
  });

  revalidatePath(`/shipments/${shipmentId}`);
  redirect(`/shipments/${shipmentId}`);
}
