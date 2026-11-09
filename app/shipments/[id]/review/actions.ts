'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '../../../../src/lib/auth';
import { db } from '../../../../src/prisma/db';
import { runChecksForShipment } from '../../../../src/lib/run-checks-for-shipment';
import { EXPECTED_FIELDS } from '../../../../src/lib/extraction/field-config';

const EditFieldValueSchema = z.string().trim().min(1, 'Value cannot be empty');
const OverrideNoteSchema = z.string().trim().min(1, 'A note is required to override a failed check');

// Confirming with no value change still writes a FieldEdit row — hard rule #4
// says every confirmation is logged, not just ones that change the value.
export async function confirmField(shipmentId: number, fieldId: number) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const field = await db.orm.public.ExtractedField.first({ id: fieldId });
  if (!field) throw new Error('Field not found');

  await db.transaction(async (tx) => {
    await tx.orm.public.FieldEdit.create({
      fieldId,
      userId: user.id,
      oldValue: field.value,
      newValue: field.value,
      type: 'CONFIRM',
    });
    await tx.orm.public.ExtractedField.where({ id: fieldId }).update({ status: 'CONFIRMED' });
  });

  revalidatePath(`/shipments/${shipmentId}/review`);
}

export async function editField(shipmentId: number, fieldId: number, formData: FormData) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const newValue = EditFieldValueSchema.parse(formData.get('value'));

  const field = await db.orm.public.ExtractedField.first({ id: fieldId });
  if (!field) throw new Error('Field not found');

  await db.transaction(async (tx) => {
    await tx.orm.public.FieldEdit.create({
      fieldId,
      userId: user.id,
      oldValue: field.value,
      newValue,
      type: 'EDIT',
    });
    await tx.orm.public.ExtractedField.where({ id: fieldId }).update({ value: newValue, status: 'CONFIRMED' });
  });

  // The edit may have changed a value a cross-check depends on — re-run them.
  await runChecksForShipment(shipmentId);

  revalidatePath(`/shipments/${shipmentId}/review`);
}

export async function confirmLineItem(shipmentId: number, lineItemId: number) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const item = await db.orm.public.LineItem.first({ id: lineItemId });
  if (!item) throw new Error('Line item not found');

  await db.transaction(async (tx) => {
    await tx.orm.public.FieldEdit.create({
      lineItemId,
      userId: user.id,
      oldValue: item.description,
      newValue: item.description,
      type: 'CONFIRM',
    });
    await tx.orm.public.LineItem.where({ id: lineItemId }).update({ status: 'CONFIRMED' });
  });

  revalidatePath(`/shipments/${shipmentId}/review`);
}

// For a document whose extraction failed completely (zero fields) — lets a
// human type in the values directly instead of there being nothing to review.
export async function manualEntry(shipmentId: number, documentId: number, formData: FormData) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const document = await db.orm.public.Document.first({ id: documentId });
  if (!document) throw new Error('Document not found');

  const fieldNames = EXPECTED_FIELDS[document.type];

  await db.transaction(async (tx) => {
    for (const name of fieldNames) {
      const raw = formData.get(name);
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (!value) continue; // manual entry can be partial — fill in what's known

      const field = await tx.orm.public.ExtractedField.upsert({
        create: { documentId, name, value, confidence: null, status: 'MANUAL' },
        update: { value, status: 'MANUAL' },
      });

      await tx.orm.public.FieldEdit.create({
        fieldId: field.id,
        userId: user.id,
        oldValue: null,
        newValue: value,
        type: 'MANUAL_ENTRY',
      });
    }

    await tx.orm.public.Document.where({ id: documentId }).update({ extractionStatus: 'SUCCEEDED', extractionError: null });
  });

  await runChecksForShipment(shipmentId);

  revalidatePath(`/shipments/${shipmentId}/review`);
}

// A failed check is resolved one of two ways: fix a value (which re-runs the
// check automatically — see editField above) or override it with a mandatory
// note. There is no bare "mark resolved" with no reason.
export async function overrideCheck(shipmentId: number, checkId: number, formData: FormData) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const note = OverrideNoteSchema.parse(formData.get('note'));

  const check = await db.orm.public.CheckResult.first({ id: checkId });
  if (!check) throw new Error('Check not found');

  await db.transaction(async (tx) => {
    await tx.orm.public.CheckResult.where({ id: checkId }).update({
      resolvedById: user.id,
      resolvedAt: new Date(),
      resolutionNote: note,
    });

    for (const fieldId of check.involvedFieldIds) {
      await tx.orm.public.FieldEdit.create({
        fieldId,
        userId: user.id,
        oldValue: null,
        newValue: `Override: ${note}`,
        type: 'OVERRIDE',
      });
    }
  });

  revalidatePath(`/shipments/${shipmentId}/review`);
}
