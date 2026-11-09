// Generates synthetic invoice / packing list / bill of lading PDFs for manually
// exercising upload + AI extraction. Fake data only — see hard rule #5.
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.join(process.cwd(), "fixtures", "pdfs");
const PAGE_SIZE = [612, 792]; // US Letter

async function newPage() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage(PAGE_SIZE);
  return { pdf, page, font, bold };
}

// skewDegrees simulates a crooked scan: pdf-lib's page-level setRotation only
// takes multiples of 90, so a real tilt has to be applied per text draw call.
function drawField(page, font, label, value, x, y, skewDegrees = 0) {
  page.drawText(`${label}: ${value}`, { x, y, size: 11, font, rotate: degrees(skewDegrees) });
}

function drawLineItems(page, font, bold, lineItems, startY, skewDegrees = 0) {
  const rotate = degrees(skewDegrees);
  let y = startY;
  page.drawText("Description", { x: 50, y, size: 10, font: bold, rotate });
  page.drawText("Qty", { x: 300, y, size: 10, font: bold, rotate });
  page.drawText("Unit Price", { x: 360, y, size: 10, font: bold, rotate });
  page.drawText("Line Total", { x: 450, y, size: 10, font: bold, rotate });
  y -= 18;
  for (const item of lineItems) {
    page.drawText(item.description, { x: 50, y, size: 10, font, rotate });
    page.drawText(String(item.quantity), { x: 300, y, size: 10, font, rotate });
    page.drawText(item.unitPrice.toFixed(2), { x: 360, y, size: 10, font, rotate });
    page.drawText(item.lineTotal.toFixed(2), { x: 450, y, size: 10, font, rotate });
    y -= 16;
  }
  return y;
}

async function buildInvoice(data) {
  const { pdf, page, font, bold } = await newPage();
  const skew = data.skewDegrees ?? 0;
  page.drawText("COMMERCIAL INVOICE", { x: 50, y: 740, size: 16, font: bold, rotate: degrees(skew) });
  drawField(page, font, "Shipment Ref", data.reference, 50, 710, skew);
  drawField(page, font, "Invoice No", data.invoiceNumber, 50, 695, skew);
  drawField(page, font, "Date", data.date, 50, 680, skew);
  drawField(page, font, "Shipper", data.shipper, 50, 665, skew);
  drawField(page, font, "Consignee", data.consignee, 50, 650, skew);
  drawField(page, font, "Incoterm", data.incoterm, 50, 635, skew);
  drawField(page, font, "Container No", data.containerNumber, 50, 620, skew);
  drawField(page, font, "Gross Weight (kg)", data.grossWeightKg, 50, 605, skew);
  drawField(page, font, "Packages", data.packagesCount, 50, 590, skew);
  const afterTable = drawLineItems(page, font, bold, data.lineItems, 550, skew);
  drawField(page, bold, `Invoice Total (${data.currency})`, data.invoiceTotal.toFixed(2), 50, afterTable - 14, skew);
  return pdf.save();
}

async function buildPackingList(data) {
  const { pdf, page, font, bold } = await newPage();
  page.drawText("PACKING LIST", { x: 50, y: 740, size: 16, font: bold });
  drawField(page, font, "Shipment Ref", data.reference, 50, 710);
  drawField(page, font, "Date", data.date, 50, 695);
  drawField(page, font, "Shipper", data.shipper, 50, 680);
  drawField(page, font, "Consignee", data.consignee, 50, 665);
  drawField(page, font, "Container No", data.containerNumber, 50, 650);
  drawField(page, font, "Gross Weight (kg)", data.grossWeightKg, 50, 635);
  drawField(page, font, "Packages", data.packagesCount, 50, 620);
  return pdf.save();
}

async function buildBillOfLading(data) {
  const { pdf, page, font, bold } = await newPage();
  page.drawText("BILL OF LADING", { x: 50, y: 740, size: 16, font: bold });
  drawField(page, font, "Shipment Ref", data.reference, 50, 710);
  drawField(page, font, "Date", data.date, 50, 695);
  drawField(page, font, "Shipper", data.shipper, 50, 680);
  drawField(page, font, "Consignee", data.consignee, 50, 665);
  drawField(page, font, "Container No", data.containerNumber, 50, 650);
  drawField(page, font, "Packages", data.packagesCount, 50, 635);
  drawField(page, font, "Vessel", data.vessel, 50, 620);
  drawField(page, font, "Port of Discharge", data.portOfDischarge, 50, 605);
  return pdf.save();
}

// --- Scenario data -----------------------------------------------------

const clean = {
  reference: "SHP-CLEAN-01",
  date: "2026-01-10",
  shipper: "Company D (Vietnam)",
  consignee: "Company A",
  incoterm: "FOB",
  containerNumber: "HLXU9988776",
  grossWeightKg: 2200,
  packagesCount: 50,
};

const shp24811 = {
  reference: "SHP-24811",
  date: "2026-01-12",
  shipper: "Company B (China)",
  consignee: "Company A",
  incoterm: "FOB",
  containerNumber: "MSKU1234567",
  packagesCount: 120,
};

// Real sample data from the brief: 180 x Steel ball valve DN50 @ EUR 42.50,
// gross weight 1460kg. Packing list and bill of lading are deliberately
// missing for this shipment — see the "cannot cross-check" scenario.
const shp24812 = {
  reference: "SHP-24812",
  date: "2026-01-14",
  shipper: "Company C (Sweden)",
  consignee: "Company A",
  incoterm: "CIF",
  containerNumber: "TCLU7654321",
  grossWeightKg: 1460,
  packagesCount: 18,
};

const scenarios = [
  {
    filename: "clean-invoice.pdf",
    build: () =>
      buildInvoice({
        ...clean,
        invoiceNumber: "INV-CLEAN-01",
        currency: "USD",
        invoiceTotal: 5000,
        lineItems: [
          { description: "Brass gate valve DN25", quantity: 500, unitPrice: 10, lineTotal: 5000 },
        ],
      }),
  },
  {
    filename: "clean-packing-list.pdf",
    build: () => buildPackingList(clean),
  },
  {
    filename: "clean-bill-of-lading.pdf",
    build: () =>
      buildBillOfLading({ ...clean, vessel: "MV Pacific Trader", portOfDischarge: "Nhava Sheva" }),
  },
  {
    filename: "shp24811-invoice.pdf",
    build: () =>
      buildInvoice({
        ...shp24811,
        invoiceNumber: "INV-24811",
        currency: "USD",
        grossWeightKg: 3120,
        invoiceTotal: 16320,
        lineItems: [
          { description: "LED panel light 40W", quantity: 2400, unitPrice: 6.8, lineTotal: 16320 },
        ],
      }),
  },
  {
    filename: "shp24811-packing-list.pdf",
    build: () => buildPackingList({ ...shp24811, grossWeightKg: 3165 }), // 45kg / ~1.4% off the invoice
  },
  {
    filename: "shp24811-bill-of-lading.pdf",
    build: () =>
      buildBillOfLading({ ...shp24811, vessel: "MV Nordic Carrier", portOfDischarge: "Nhava Sheva" }),
  },
  {
    filename: "shp24812-invoice.pdf",
    build: () =>
      buildInvoice({
        ...shp24812,
        invoiceNumber: "INV-24812",
        currency: "EUR",
        invoiceTotal: 7650,
        lineItems: [
          { description: "Steel ball valve DN50", quantity: 180, unitPrice: 42.5, lineTotal: 7650 },
        ],
      }),
  },
  {
    filename: "bad-invoice-total.pdf",
    build: () =>
      buildInvoice({
        reference: "SHP-BADTOTAL-01",
        invoiceNumber: "INV-BADTOTAL-01",
        date: "2026-01-16",
        shipper: "Company E (Germany)",
        consignee: "Company A",
        incoterm: "CFR",
        containerNumber: "CMAU4455667",
        grossWeightKg: 1800,
        packagesCount: 30,
        currency: "USD",
        invoiceTotal: 4100, // line items sum to 3600 — a $500 clerical error
        lineItems: [
          { description: "Galvanized pipe fitting", quantity: 300, unitPrice: 12, lineTotal: 3600 },
        ],
      }),
  },
  {
    // Simulates a crooked scan — every line tilted a few degrees, per the
    // brief's "scans are often skewed" constraint. Otherwise identical to
    // the clean invoice, so a correct extraction should read the same values
    // despite the tilt.
    filename: "skewed-invoice.pdf",
    build: () =>
      buildInvoice({
        ...clean,
        invoiceNumber: "INV-SKEWED-01",
        currency: "USD",
        invoiceTotal: 5000,
        skewDegrees: 4,
        lineItems: [
          { description: "Brass gate valve DN25", quantity: 500, unitPrice: 10, lineTotal: 5000 },
        ],
      }),
  },
];

await mkdir(OUTPUT_DIR, { recursive: true });
for (const scenario of scenarios) {
  const bytes = await scenario.build();
  await writeFile(path.join(OUTPUT_DIR, scenario.filename), bytes);
  console.log(`wrote ${scenario.filename}`);
}
