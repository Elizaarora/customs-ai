import type { CheckOutcome, DocumentKind, ShipmentDocuments } from "./types";

export function checkContainerNumbers(documents: ShipmentDocuments): CheckOutcome {
  const { invoice, packingList, billOfLading } = documents;

  const missingDocuments: DocumentKind[] = [];
  if (!invoice) missingDocuments.push("INVOICE");
  if (!packingList) missingDocuments.push("PACKING_LIST");
  if (!billOfLading) missingDocuments.push("BILL_OF_LADING");

  if (missingDocuments.length > 0 || !invoice || !packingList || !billOfLading) {
    return {
      status: "CANNOT_CHECK",
      details: `Cannot compare container numbers: missing ${missingDocuments.join(", ")}`,
      missingDocuments,
    };
  }

  const numbers = {
    invoice: invoice.containerNumber,
    packingList: packingList.containerNumber,
    billOfLading: billOfLading.containerNumber,
  };

  if (numbers.invoice === numbers.packingList && numbers.packingList === numbers.billOfLading) {
    return { status: "PASS", details: `All documents cite container ${numbers.invoice}` };
  }

  return {
    status: "FAIL",
    details: `Container numbers disagree — invoice: ${numbers.invoice}, packing list: ${numbers.packingList}, bill of lading: ${numbers.billOfLading}`,
  };
}
