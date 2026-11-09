import { describe, expect, it } from "vitest";
import { checkContainerNumbers } from "../container-numbers";
import { cleanShipment } from "./fixtures";

describe("checkContainerNumbers", () => {
  it("passes when invoice, packing list and bill of lading all cite the same container", () => {
    const result = checkContainerNumbers(cleanShipment);

    expect(result.status).toBe("PASS");
  });

  it("fails with the conflicting container numbers in the details", () => {
    const inconsistent = {
      ...cleanShipment,
      billOfLading: { ...cleanShipment.billOfLading!, containerNumber: "WRONG0000001" },
    };

    const result = checkContainerNumbers(inconsistent);

    expect(result.status).toBe("FAIL");
    expect(result.details).toContain("HLXU9988776");
    expect(result.details).toContain("WRONG0000001");
  });

  it("returns CANNOT_CHECK naming every missing document", () => {
    const result = checkContainerNumbers({ invoice: cleanShipment.invoice });

    expect(result.status).toBe("CANNOT_CHECK");
    expect(result.missingDocuments).toEqual(
      expect.arrayContaining(["PACKING_LIST", "BILL_OF_LADING"])
    );
  });
});
