import type { Models } from '../../prisma/contract.d';

type DocumentType = Models.public_Document['type'];

// Fields common to every document type per the brief: parties, invoice/BL
// number and date, currency, Incoterm.
const COMMON_FIELDS = ['shipper', 'consignee', 'documentNumber', 'date', 'currency', 'incoterm'];

// The field names we ask Gemini to extract, per document type.
export const EXPECTED_FIELDS: Record<DocumentType, string[]> = {
  INVOICE: [...COMMON_FIELDS, 'invoiceTotal', 'grossWeightKg', 'packagesCount', 'containerNumber'],
  PACKING_LIST: [...COMMON_FIELDS, 'grossWeightKg', 'packagesCount', 'containerNumber'],
  BILL_OF_LADING: [...COMMON_FIELDS, 'packagesCount', 'containerNumber', 'vessel', 'portOfDischarge'],
};

export const DOCUMENT_TYPES_WITH_LINE_ITEMS: DocumentType[] = ['INVOICE'];
