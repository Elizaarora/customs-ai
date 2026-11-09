// Pure — no DB, no I/O. One row per invoice line item, with shipment-level
// fields repeated so each row stands on its own. The real filing software's
// exact import layout was never specified, so this is this project's own
// shape — see docs/DECISIONS.md.

export interface ExportRow {
  reference: string;
  shipper: string;
  consignee: string;
  documentNumber: string;
  date: string;
  currency: string;
  incoterm: string;
  containerNumber: string;
  packagesCount: string;
  grossWeightKg: string;
  description: string;
  hsn: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

const COLUMNS: (keyof ExportRow)[] = [
  "reference",
  "shipper",
  "consignee",
  "documentNumber",
  "date",
  "currency",
  "incoterm",
  "containerNumber",
  "packagesCount",
  "grossWeightKg",
  "description",
  "hsn",
  "quantity",
  "unitPrice",
  "lineTotal",
];

function escapeCsvValue(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildExportCsv(rows: ExportRow[]): string {
  const lines = [COLUMNS.join(",")];

  for (const row of rows) {
    lines.push(COLUMNS.map((column) => escapeCsvValue(row[column])).join(","));
  }

  return lines.join("\r\n") + "\r\n";
}
