// Shared sample data for check tests. Test support only, not shipped.
import type { ShipmentDocuments } from "../types";

// SHP-24811: 2400 x LED panel light 40W @ USD 6.80 (total USD 16,320).
// Gross weight 3120 kg (invoice) vs 3165 kg (packing list) — must FAIL.
export const shp24811: ShipmentDocuments = {
  invoice: {
    invoiceTotal: 16320,
    grossWeightKg: 3120,
    packagesCount: 120,
    containerNumber: "MSKU1234567",
    lineItems: [
      { description: "LED panel light 40W", quantity: 2400, unitPrice: 6.8, lineTotal: 16320 },
    ],
  },
  packingList: {
    grossWeightKg: 3165,
    packagesCount: 120,
    containerNumber: "MSKU1234567",
  },
  billOfLading: {
    packagesCount: 120,
    containerNumber: "MSKU1234567",
  },
};

// SHP-24812: invoice only (180 x Steel ball valve DN50 @ EUR 42.50 = EUR 7,650).
// Packing list and bill of lading missing — every check must report CANNOT_CHECK.
export const shp24812: ShipmentDocuments = {
  invoice: {
    invoiceTotal: 7650,
    grossWeightKg: 980,
    packagesCount: 18,
    containerNumber: "TCLU7654321",
    lineItems: [
      { description: "Steel ball valve DN50", quantity: 180, unitPrice: 42.5, lineTotal: 7650 },
    ],
  },
};

// A clean, fully consistent three-document shipment. Every check must PASS.
export const cleanShipment: ShipmentDocuments = {
  invoice: {
    invoiceTotal: 5000,
    grossWeightKg: 2200,
    packagesCount: 50,
    containerNumber: "HLXU9988776",
    lineItems: [
      { description: "Brass gate valve DN25", quantity: 500, unitPrice: 10, lineTotal: 5000 },
    ],
  },
  packingList: {
    grossWeightKg: 2200,
    packagesCount: 50,
    containerNumber: "HLXU9988776",
  },
  billOfLading: {
    packagesCount: 50,
    containerNumber: "HLXU9988776",
  },
};
