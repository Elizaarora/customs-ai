// Seeds the shipments explicitly named in the brief as real, reviewable
// records — not just generated PDF files sitting on disk. A user shouldn't
// have to manually create a shipment and upload each fixture by hand just to
// see the two named scenarios (SHP-24811, SHP-24812) and a clean, ready-to-
// export one.
//
// Field values and cross-check results are computed the same way a real
// upload would produce them (via the real EXPECTED_FIELDS shape and the real
// runChecksForShipment), not hardcoded — this also serves as a live check
// that the app's own logic reproduces the brief's stated facts (SHP-24811
// must fail the weight check; SHP-24812 must report cannot-check).
//
// Run with: npm run fixtures:pdfs (generates the PDFs this reads) then
// npm run db:seed:shipments. Safe to re-run: every row is upserted by its
// unique key (shipment reference, [shipmentId, type], [documentId, name]).
//
// Needs the react-server export condition (baked into the npm script) to
// import storage.ts and run-checks-for-shipment.ts — both carry a
// 'server-only' guard that's a no-op inside Next's own server bundler but
// throws unconditionally under plain Node/tsx otherwise.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';
import { saveFile } from '../lib/storage/storage';
import { runChecksForShipment } from '../lib/run-checks-for-shipment';

const FIXTURES_DIR = path.join(process.cwd(), 'fixtures', 'pdfs');

interface FieldSeed {
  name: string;
  value: string;
  confidence: number;
}

interface LineItemSeed {
  description: string;
  hsn: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  confidence: number;
}

interface DocumentSeed {
  type: 'INVOICE' | 'PACKING_LIST' | 'BILL_OF_LADING';
  fixtureFilename: string;
  fields: FieldSeed[];
  lineItems?: LineItemSeed[];
}

interface ShipmentSeed {
  reference: string;
  documents: DocumentSeed[];
}

function status(confidence: number) {
  return confidence >= 0.8 ? ('AUTO' as const) : ('NEEDS_REVIEW' as const);
}

// SHP-24811 — brief's named weight-mismatch scenario: invoice gross weight
// 3120kg vs packing list 3165kg, must FAIL the weight check.
const shp24811: ShipmentSeed = {
  reference: 'SHP-24811',
  documents: [
    {
      type: 'INVOICE',
      fixtureFilename: 'shp24811-invoice.pdf',
      fields: [
        { name: 'shipper', value: 'Company B (China)', confidence: 0.62 }, // deliberately uncertain, for the review screen demo
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'INV-24811', confidence: 0.96 },
        { name: 'date', value: '2026-01-12', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.98 },
        { name: 'incoterm', value: 'FOB', confidence: 0.94 },
        { name: 'invoiceTotal', value: '16320.00', confidence: 0.97 },
        { name: 'grossWeightKg', value: '3120', confidence: 0.95 },
        { name: 'packagesCount', value: '120', confidence: 0.96 },
        { name: 'containerNumber', value: 'MSKU1234567', confidence: 0.93 },
      ],
      lineItems: [
        { description: 'LED panel light 40W', hsn: '9405', quantity: 2400, unitPrice: 6.8, lineTotal: 16320, confidence: 0.96 },
      ],
    },
    {
      type: 'PACKING_LIST',
      fixtureFilename: 'shp24811-packing-list.pdf',
      fields: [
        { name: 'shipper', value: 'Company B (China)', confidence: 0.95 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'SHP-24811', confidence: 0.9 },
        { name: 'date', value: '2026-01-12', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.9 },
        { name: 'incoterm', value: 'FOB', confidence: 0.9 },
        { name: 'grossWeightKg', value: '3165', confidence: 0.95 },
        { name: 'packagesCount', value: '120', confidence: 0.96 },
        { name: 'containerNumber', value: 'MSKU1234567', confidence: 0.93 },
      ],
    },
    {
      type: 'BILL_OF_LADING',
      fixtureFilename: 'shp24811-bill-of-lading.pdf',
      fields: [
        { name: 'shipper', value: 'Company B (China)', confidence: 0.95 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'SHP-24811', confidence: 0.9 },
        { name: 'date', value: '2026-01-12', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.9 },
        { name: 'incoterm', value: 'FOB', confidence: 0.9 },
        { name: 'packagesCount', value: '120', confidence: 0.96 },
        { name: 'containerNumber', value: 'MSKU1234567', confidence: 0.93 },
        { name: 'vessel', value: 'MV Nordic Carrier', confidence: 0.92 },
        { name: 'portOfDischarge', value: 'Nhava Sheva', confidence: 0.94 },
      ],
    },
  ],
};

// SHP-24812 — brief's named "cannot cross-check" scenario: invoice only,
// packing list and bill of lading deliberately missing.
const shp24812: ShipmentSeed = {
  reference: 'SHP-24812',
  documents: [
    {
      type: 'INVOICE',
      fixtureFilename: 'shp24812-invoice.pdf',
      fields: [
        { name: 'shipper', value: 'Company C (Sweden)', confidence: 0.96 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'INV-24812', confidence: 0.55 }, // deliberately uncertain
        { name: 'date', value: '2026-01-14', confidence: 0.95 },
        { name: 'currency', value: 'EUR', confidence: 0.98 },
        { name: 'incoterm', value: 'CIF', confidence: 0.94 },
        { name: 'invoiceTotal', value: '7650.00', confidence: 0.97 },
        { name: 'grossWeightKg', value: '1460', confidence: 0.95 },
        { name: 'packagesCount', value: '18', confidence: 0.96 },
        { name: 'containerNumber', value: 'TCLU7654321', confidence: 0.93 },
      ],
      lineItems: [
        { description: 'Steel ball valve DN50', hsn: '8481', quantity: 180, unitPrice: 42.5, lineTotal: 7650, confidence: 0.96 },
      ],
    },
  ],
};

// A fully clean shipment — nothing to review, every check passes, ready for
// approval and export. Shows the full happy path end to end.
const clean: ShipmentSeed = {
  reference: 'SHP-24900',
  documents: [
    {
      type: 'INVOICE',
      fixtureFilename: 'clean-invoice.pdf',
      fields: [
        { name: 'shipper', value: 'Company D (Vietnam)', confidence: 0.97 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'INV-CLEAN-01', confidence: 0.96 },
        { name: 'date', value: '2026-01-10', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.98 },
        { name: 'incoterm', value: 'FOB', confidence: 0.94 },
        { name: 'invoiceTotal', value: '5000.00', confidence: 0.97 },
        { name: 'grossWeightKg', value: '2200', confidence: 0.95 },
        { name: 'packagesCount', value: '50', confidence: 0.96 },
        { name: 'containerNumber', value: 'HLXU9988776', confidence: 0.93 },
      ],
      lineItems: [
        { description: 'Brass gate valve DN25', hsn: '8481', quantity: 500, unitPrice: 10, lineTotal: 5000, confidence: 0.96 },
      ],
    },
    {
      type: 'PACKING_LIST',
      fixtureFilename: 'clean-packing-list.pdf',
      fields: [
        { name: 'shipper', value: 'Company D (Vietnam)', confidence: 0.95 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'SHP-24900', confidence: 0.9 },
        { name: 'date', value: '2026-01-10', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.9 },
        { name: 'incoterm', value: 'FOB', confidence: 0.9 },
        { name: 'grossWeightKg', value: '2200', confidence: 0.95 },
        { name: 'packagesCount', value: '50', confidence: 0.96 },
        { name: 'containerNumber', value: 'HLXU9988776', confidence: 0.93 },
      ],
    },
    {
      type: 'BILL_OF_LADING',
      fixtureFilename: 'clean-bill-of-lading.pdf',
      fields: [
        { name: 'shipper', value: 'Company D (Vietnam)', confidence: 0.95 },
        { name: 'consignee', value: 'Company A', confidence: 0.97 },
        { name: 'documentNumber', value: 'SHP-24900', confidence: 0.9 },
        { name: 'date', value: '2026-01-10', confidence: 0.95 },
        { name: 'currency', value: 'USD', confidence: 0.9 },
        { name: 'incoterm', value: 'FOB', confidence: 0.9 },
        { name: 'packagesCount', value: '50', confidence: 0.96 },
        { name: 'containerNumber', value: 'HLXU9988776', confidence: 0.93 },
        { name: 'vessel', value: 'MV Pacific Trader', confidence: 0.92 },
        { name: 'portOfDischarge', value: 'Nhava Sheva', confidence: 0.94 },
      ],
    },
  ],
};

async function seedShipment(seed: ShipmentSeed, uploadedById: number) {
  const shipment = await db.orm.public.Shipment.upsert({
    conflictOn: { reference: seed.reference },
    create: { reference: seed.reference, status: 'DRAFT' },
    update: {},
  });

  for (const docSeed of seed.documents) {
    const bytes = await readFile(path.join(FIXTURES_DIR, docSeed.fixtureFilename));
    const relativePath = `${shipment.id}/${docSeed.type}.pdf`;
    await saveFile(bytes, relativePath);

    const document = await db.orm.public.Document.upsert({
      conflictOn: { shipmentId: shipment.id, type: docSeed.type },
      create: {
        shipmentId: shipment.id,
        type: docSeed.type,
        filePath: relativePath,
        uploadedById,
        extractionStatus: 'SUCCEEDED',
      },
      update: { filePath: relativePath, extractionStatus: 'SUCCEEDED', extractionError: null },
    });

    for (const field of docSeed.fields) {
      await db.orm.public.ExtractedField.upsert({
        conflictOn: { documentId: document.id, name: field.name },
        create: {
          documentId: document.id,
          name: field.name,
          value: field.value,
          confidence: field.confidence,
          status: status(field.confidence),
        },
        update: { value: field.value, confidence: field.confidence, status: status(field.confidence) },
      });
    }

    await db.orm.public.LineItem.where({ documentId: document.id }).deleteAll();
    for (const item of docSeed.lineItems ?? []) {
      await db.orm.public.LineItem.create({
        documentId: document.id,
        description: item.description,
        hsn: item.hsn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        confidence: item.confidence,
        status: status(item.confidence),
      });
    }
  }

  await runChecksForShipment(shipment.id);
  console.log(`Seeded ${seed.reference} (${seed.documents.length}/3 documents)`);
}

async function main() {
  const exec = await db.orm.public.User.first({ email: 'exec@example.com' });
  if (!exec) {
    throw new Error('Run npm run db:seed first to create the demo users.');
  }

  for (const seed of [shp24811, shp24812, clean]) {
    await seedShipment(seed, exec.id);
  }
}

main().then(() => process.exit(0));
