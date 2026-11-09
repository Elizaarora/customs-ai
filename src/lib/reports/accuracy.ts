import 'server-only';
import { db } from '../../prisma/db';
import { fieldValue } from '../documents/field-value';

export interface FieldAccuracyRow {
  fieldName: string;
  total: number;
  edited: number;
}

export interface SupplierAccuracyRow {
  supplier: string;
  total: number;
  edited: number;
}

// "Accuracy" here means "the model's first answer didn't need a correction" —
// a field that was only ever confirmed as-is, or extracted with no edit at
// all, counts as accurate; a field with any EDIT in its history doesn't.
// This is a proxy, not a measured accuracy against ground truth — there is
// no ground-truth dataset in this project to compare against.
export async function computeAccuracyReport(): Promise<{
  byField: FieldAccuracyRow[];
  bySupplier: SupplierAccuracyRow[];
}> {
  const shipments = await db.orm.public.Shipment.select('id')
    .include('documents', (documents) =>
      documents
        .select('type')
        .include('fields', (fields) =>
          fields.select('name', 'value').include('edits', (edits) => edits.select('type')),
        ),
    )
    .all();

  const byFieldMap = new Map<string, { total: number; edited: number }>();
  const bySupplierMap = new Map<string, { total: number; edited: number }>();

  for (const shipment of shipments) {
    const invoice = shipment.documents.find((document) => document.type === 'INVOICE');
    const supplier = (invoice && fieldValue(invoice.fields, 'shipper')) || 'Unknown supplier';

    for (const document of shipment.documents) {
      for (const field of document.fields) {
        const wasEdited = field.edits.some((edit) => edit.type === 'EDIT');

        const fieldEntry = byFieldMap.get(field.name) ?? { total: 0, edited: 0 };
        fieldEntry.total += 1;
        if (wasEdited) fieldEntry.edited += 1;
        byFieldMap.set(field.name, fieldEntry);

        const supplierEntry = bySupplierMap.get(supplier) ?? { total: 0, edited: 0 };
        supplierEntry.total += 1;
        if (wasEdited) supplierEntry.edited += 1;
        bySupplierMap.set(supplier, supplierEntry);
      }
    }
  }

  const byField = [...byFieldMap.entries()]
    .map(([fieldName, counts]) => ({ fieldName, ...counts }))
    .sort((a, b) => a.fieldName.localeCompare(b.fieldName));

  const bySupplier = [...bySupplierMap.entries()]
    .map(([supplier, counts]) => ({ supplier, ...counts }))
    .sort((a, b) => a.supplier.localeCompare(b.supplier));

  return { byField, bySupplier };
}
