import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildExportXlsx } from "../xlsx";
import type { ExportRow } from "../csv";

const row: ExportRow = {
  reference: "SHP-24900",
  shipper: "Company B",
  consignee: "Company A",
  documentNumber: "INV-1001",
  date: "2026-01-15",
  currency: "USD",
  incoterm: "FOB",
  containerNumber: "HLXU9988776",
  packagesCount: "50",
  grossWeightKg: "2200",
  description: "Brass gate valve DN25",
  hsn: "8481",
  quantity: "500",
  unitPrice: "10",
  lineTotal: "5000",
};

describe("buildExportXlsx", () => {
  it("produces a workbook with a header row and one row per data row", async () => {
    const buffer = await buildExportXlsx([row]);

    const workbook = new ExcelJS.Workbook();
    // Two @types/node versions coexist in this project's dependency tree
    // (see docs/DECISIONS.md) — exceljs's own .d.ts resolves Buffer against a
    // different one than ours, so `Buffer` isn't a single nominal type here
    // and `as unknown as Buffer` still picks our declaration. `any` sidesteps
    // the structural check entirely; the real buffer bytes are unaffected.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet("Shipment Export");

    expect(sheet).toBeDefined();
    expect(sheet!.getRow(1).getCell(1).value).toBe("Reference");
    expect(sheet!.getRow(2).getCell(1).value).toBe("SHP-24900");
    expect(sheet!.getRow(2).getCell(11).value).toBe("Brass gate valve DN25");
  });

  it("produces a readable, empty-but-headered workbook for no rows", async () => {
    const buffer = await buildExportXlsx([]);

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet("Shipment Export");

    expect(sheet!.rowCount).toBe(1); // header only
  });
});
