import { describe, expect, it } from "vitest";
import { buildExportCsv, type ExportRow } from "../csv";

const HEADER =
  "reference,shipper,consignee,documentNumber,date,currency,incoterm,containerNumber,packagesCount,grossWeightKg,description,hsn,quantity,unitPrice,lineTotal";

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

describe("buildExportCsv", () => {
  it("writes just the header for no rows", () => {
    expect(buildExportCsv([])).toBe(`${HEADER}\r\n`);
  });

  it("writes one line per row in column order", () => {
    const csv = buildExportCsv([row]);

    expect(csv).toBe(
      `${HEADER}\r\n` +
        "SHP-24900,Company B,Company A,INV-1001,2026-01-15,USD,FOB,HLXU9988776,50,2200,Brass gate valve DN25,8481,500,10,5000\r\n",
    );
  });

  it("quotes a value containing a comma", () => {
    const csv = buildExportCsv([{ ...row, description: "Valve, DN25" }]);

    expect(csv).toContain('"Valve, DN25"');
  });

  it("escapes a value containing a double quote", () => {
    const csv = buildExportCsv([{ ...row, description: 'A 2" valve' }]);

    expect(csv).toContain('"A 2"" valve"');
  });

  it("quotes a value containing a newline", () => {
    const csv = buildExportCsv([{ ...row, description: "Line one\nLine two" }]);

    expect(csv).toContain('"Line one\nLine two"');
  });
});
