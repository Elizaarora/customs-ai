// SHP-24812 has only an invoice. Every check must report CANNOT_CHECK with the
// missing documents listed, and must never report PASS — a missing document is
// not evidence of agreement.
import { describe, expect, it } from "vitest";
import { checkInvoiceTotal } from "../invoice-total";
import { checkGrossWeight } from "../gross-weight";
import { checkPackagesCount } from "../packages-count";
import { checkContainerNumbers } from "../container-numbers";
import { shp24812 } from "./fixtures";

describe("SHP-24812: only an invoice present", () => {
  it("checkGrossWeight cannot check and lists the packing list as missing, never PASS", () => {
    const result = checkGrossWeight(shp24812, 1);

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.status).not.toBe("PASS");
    expect(result.missingDocuments).toEqual(["PACKING_LIST"]);
  });

  it("checkPackagesCount cannot check and lists both missing documents, never PASS", () => {
    const result = checkPackagesCount(shp24812);

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.status).not.toBe("PASS");
    expect(result.missingDocuments).toEqual(
      expect.arrayContaining(["PACKING_LIST", "BILL_OF_LADING"])
    );
  });

  it("checkContainerNumbers cannot check and lists both missing documents, never PASS", () => {
    const result = checkContainerNumbers(shp24812);

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.status).not.toBe("PASS");
    expect(result.missingDocuments).toEqual(
      expect.arrayContaining(["PACKING_LIST", "BILL_OF_LADING"])
    );
  });

  it("checkInvoiceTotal still runs, because it only needs the invoice that IS present", () => {
    // this is the one check that doesn't depend on the missing documents
    const result = checkInvoiceTotal(shp24812, 0);

    expect(result.status).not.toBe("CANNOT_CHECK");
  });
});
