import { describe, expect, it } from "vitest";
import { checkInvoiceTotal } from "../invoice-total";
import { cleanShipment } from "./fixtures";

describe("checkInvoiceTotal", () => {
  it("passes when the invoice total equals the sum of qty x unit price", () => {
    const result = checkInvoiceTotal(cleanShipment, 0);

    expect(result.status).toBe("PASS");
  });

  it("fails with the difference in the details when the total is wrong", () => {
    const badInvoice = {
      ...cleanShipment,
      invoice: { ...cleanShipment.invoice!, invoiceTotal: 5500 }, // line items sum to 5000
    };

    const result = checkInvoiceTotal(badInvoice, 0);

    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("500"); // the difference
  });

  it("returns CANNOT_CHECK when the invoice is missing", () => {
    const noInvoice = { ...cleanShipment, invoice: undefined };

    const result = checkInvoiceTotal(noInvoice, 0);

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.missingDocuments).toEqual(["INVOICE"]);
  });
});
