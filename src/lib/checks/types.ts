// Shared types for cross-check functions. No logic here — types only.

export type DocumentKind = "INVOICE" | "PACKING_LIST" | "BILL_OF_LADING";

export type CheckStatus = "PASS" | "FAIL" | "CANNOT_CHECK";

export interface CheckOutcome {
  status: CheckStatus;
  details: string;
  // populated only when status is CANNOT_CHECK
  missingDocuments?: DocumentKind[];
}

export interface LineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  invoiceTotal: number;
  grossWeightKg: number;
  packagesCount: number;
  containerNumber: string;
  lineItems: LineItemData[];
}

export interface PackingListData {
  grossWeightKg: number;
  packagesCount: number;
  containerNumber: string;
}

export interface BillOfLadingData {
  packagesCount: number;
  containerNumber: string;
}

export interface ShipmentDocuments {
  invoice?: InvoiceData;
  packingList?: PackingListData;
  billOfLading?: BillOfLadingData;
}
