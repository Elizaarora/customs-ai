import type { CheckOutcome, DocumentKind, ShipmentDocuments } from "./types";

export function checkPackagesCount(documents: ShipmentDocuments): CheckOutcome {
  const { invoice, packingList, billOfLading } = documents;

  const missingDocuments: DocumentKind[] = [];
  if (!invoice) missingDocuments.push("INVOICE");
  if (!packingList) missingDocuments.push("PACKING_LIST");
  if (!billOfLading) missingDocuments.push("BILL_OF_LADING");

  if (missingDocuments.length > 0 || !invoice || !packingList || !billOfLading) {
    return {
      status: "CANNOT_CHECK",
      details: `Cannot compare package counts: missing ${missingDocuments.join(", ")}`,
      missingDocuments,
    };
  }

  const counts = {
    invoice: invoice.packagesCount,
    packingList: packingList.packagesCount,
    billOfLading: billOfLading.packagesCount,
  };

  if (counts.invoice === counts.packingList && counts.packingList === counts.billOfLading) {
    return { status: "PASS", details: `All documents agree on ${counts.invoice} packages` };
  }

  return {
    status: "FAIL",
    details: `Package counts disagree — invoice: ${counts.invoice}, packing list: ${counts.packingList}, bill of lading: ${counts.billOfLading}`,
  };
}
