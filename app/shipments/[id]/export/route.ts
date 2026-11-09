import { z } from 'zod';
import { requireRole } from '../../../../src/lib/auth';
import { db } from '../../../../src/prisma/db';
import { canExport } from '../../../../src/lib/export/export-gate';
import { buildExportCsv, type ExportRow } from '../../../../src/lib/export/csv';
import { buildExportXlsx } from '../../../../src/lib/export/xlsx';
import { fieldValue } from '../../../../src/lib/documents/field-value';
import { parseShipmentId } from '../../../../src/lib/shipments/shipment-id';

const FormatSchema = z.enum(['csv', 'xlsx']).catch('csv');

// The actual enforcement point for hard rule #2 — a disabled button in the UI
// is not enough. Every condition is re-checked here, server-side, every time.
export async function GET(request: Request, { params }: RouteContext<'/shipments/[id]/export'>) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const format = FormatSchema.parse(new URL(request.url).searchParams.get('format'));

  const { id } = await params;
  const shipmentId = parseShipmentId(id);
  if (shipmentId === null) {
    return Response.json({ reasons: ['Shipment not found'] }, { status: 404 });
  }

  const gate = await canExport(shipmentId);
  if (!gate.allowed) {
    return Response.json({ reasons: gate.reasons }, { status: 403 });
  }

  const shipment = await db.orm.public.Shipment.where({ id: shipmentId })
    .select('id', 'reference')
    .include('documents', (documents) =>
      documents
        .select('type')
        .include('fields', (fields) => fields.select('name', 'value'))
        .include('lineItems', (lineItems) => lineItems),
    )
    .first();

  if (!shipment) {
    return Response.json({ reasons: ['Shipment not found'] }, { status: 404 });
  }

  const invoice = shipment.documents.find((document) => document.type === 'INVOICE');
  const packingList = shipment.documents.find((document) => document.type === 'PACKING_LIST');

  const invoiceField = (name: string) => fieldValue(invoice?.fields ?? [], name) ?? '';

  const sharedColumns = {
    reference: shipment.reference,
    shipper: invoiceField('shipper'),
    consignee: invoiceField('consignee'),
    documentNumber: invoiceField('documentNumber'),
    date: invoiceField('date'),
    currency: invoiceField('currency'),
    incoterm: invoiceField('incoterm'),
    containerNumber: invoiceField('containerNumber'),
    packagesCount: invoiceField('packagesCount'),
    grossWeightKg: fieldValue(packingList?.fields ?? [], 'grossWeightKg') ?? '',
  };

  const rows: ExportRow[] = (invoice?.lineItems ?? []).map((item) => ({
    ...sharedColumns,
    description: item.description,
    hsn: item.hsn ?? '',
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    lineTotal: String(item.lineTotal),
  }));

  await db.transaction(async (tx) => {
    await tx.orm.public.Shipment.where({ id: shipmentId }).update({ status: 'EXPORTED' });
    await tx.orm.public.ExportLog.create({ shipmentId, userId: user.id, rowCount: rows.length });
  });

  if (format === 'xlsx') {
    const bytes = await buildExportXlsx(rows);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${shipment.reference}.xlsx"`,
      },
    });
  }

  return new Response(buildExportCsv(rows), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${shipment.reference}.csv"`,
    },
  });
}
