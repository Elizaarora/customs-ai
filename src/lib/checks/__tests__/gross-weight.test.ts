import { describe, expect, it } from "vitest";
import { checkGrossWeight } from "../gross-weight";
import { cleanShipment, shp24811 } from "./fixtures";

describe("checkGrossWeight", () => {
  it("SHP-24811: fails when invoice (3120kg) and packing list (3165kg) differ by ~1.4%, more than tolerance", () => {
    const tolerancePercent = 1; // must be looser than the real diff for this test to mean anything

    const result = checkGrossWeight(shp24811, tolerancePercent);

    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("45"); // the 45kg difference
  });

  it("passes when the difference is within the given tolerance", () => {
    const withinTolerance = {
      ...shp24811,
      packingList: { ...shp24811.packingList!, grossWeightKg: 3125 }, // 5kg off, ~0.16%
    };

    const result = checkGrossWeight(withinTolerance, 1); // 1% tolerance

    expect(result.status).toBe("PASS");
  });

  it("passes on a clean shipment with matching weights", () => {
    const result = checkGrossWeight(cleanShipment, 1);

    expect(result.status).toBe("PASS");
  });

  it("returns CANNOT_CHECK listing both missing documents when invoice and packing list are absent", () => {
    const result = checkGrossWeight({}, 1);

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.missingDocuments).toEqual(
      expect.arrayContaining(["INVOICE", "PACKING_LIST"])
    );
  });
});
