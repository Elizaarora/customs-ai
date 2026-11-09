import { describe, expect, it } from "vitest";
import { checkPackagesCount } from "../packages-count";
import { cleanShipment } from "./fixtures";

describe("checkPackagesCount", () => {
  it("passes when invoice, packing list and bill of lading all agree", () => {
    const result = checkPackagesCount(cleanShipment);

    expect(result.status).toBe("PASS");
  });

  it("fails with the mismatched counts in the details when one document disagrees", () => {
    const mismatched = {
      ...cleanShipment,
      billOfLading: { ...cleanShipment.billOfLading!, packagesCount: 48 },
    };

    const result = checkPackagesCount(mismatched);

    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("50");
    expect(result.details).toContain("48");
  });

  it("returns CANNOT_CHECK naming every missing document", () => {
    const result = checkPackagesCount({ invoice: cleanShipment.invoice });

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.missingDocuments).toEqual(
      expect.arrayContaining(["PACKING_LIST", "BILL_OF_LADING"])
    );
  });
});
