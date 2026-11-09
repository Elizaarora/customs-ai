import type { CheckOutcome, DocumentKind, ShipmentDocuments } from "./types";

export function checkGrossWeight(documents: ShipmentDocuments, tolerancePercent: number): CheckOutcome {
  const { invoice, packingList } = documents;

  const missingDocuments: DocumentKind[] = [];
  if (!invoice) missingDocuments.push("INVOICE");
  if (!packingList) missingDocuments.push("PACKING_LIST");

  if (missingDocuments.length > 0 || !invoice || !packingList) {
    return {
      status: "CANNOT_CHECK",
      details: `Cannot compare gross weight: missing ${missingDocuments.join(", ")}`,
      missingDocuments,
    };
  }

  const difference = Math.abs(invoice.grossWeightKg - packingList.grossWeightKg);
  const percentDifference = (difference / invoice.grossWeightKg) * 100;

  if (percentDifference <= tolerancePercent) {
    return {
      status: "PASS",
      details: `Gross weight matches within tolerance (${difference}kg difference)`,
    };
  }

  return {
    status: "FAIL",
    details: `Invoice gross weight ${invoice.grossWeightKg}kg vs packing list ${packingList.grossWeightKg}kg — ${difference}kg (${percentDifference.toFixed(2)}%) difference`,
  };
}
