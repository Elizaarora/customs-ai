import type { CheckOutcome, ShipmentDocuments } from "./types";

export function checkInvoiceTotal(documents: ShipmentDocuments, toleranceAbsolute: number): CheckOutcome {
  const { invoice } = documents;

  if (!invoice) {
    return {
      status: "CANNOT_CHECK",
      details: "Invoice is missing",
      missingDocuments: ["INVOICE"],
    };
  }

  const lineItemsTotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const difference = Math.abs(invoice.invoiceTotal - lineItemsTotal);

  if (difference <= toleranceAbsolute) {
    return { status: "PASS", details: `Invoice total ${invoice.invoiceTotal} matches line items` };
  }

  return {
    status: "FAIL",
    details: `Invoice total ${invoice.invoiceTotal} differs from line items sum ${lineItemsTotal} by ${difference}`,
  };
}
