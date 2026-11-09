import ExcelJS from 'exceljs';
import type { ExportRow } from './csv';

// Same columns as the CSV export (src/lib/export/csv.ts) — the real filing
// software's exact import layout was never specified, so this is this
// project's own shape in spreadsheet form. See docs/DECISIONS.md.
const COLUMNS: { header: string; key: keyof ExportRow }[] = [
  { header: 'Reference', key: 'reference' },
  { header: 'Shipper', key: 'shipper' },
  { header: 'Consignee', key: 'consignee' },
  { header: 'Document Number', key: 'documentNumber' },
  { header: 'Date', key: 'date' },
  { header: 'Currency', key: 'currency' },
  { header: 'Incoterm', key: 'incoterm' },
  { header: 'Container Number', key: 'containerNumber' },
  { header: 'Packages', key: 'packagesCount' },
  { header: 'Gross Weight (kg)', key: 'grossWeightKg' },
  { header: 'Description', key: 'description' },
  { header: 'HSN', key: 'hsn' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'Unit Price', key: 'unitPrice' },
  { header: 'Line Total', key: 'lineTotal' },
];

export async function buildExportXlsx(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Shipment Export');
  sheet.columns = COLUMNS;

  for (const row of rows) {
    sheet.addRow(row);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
