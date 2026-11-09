// A fully consistent three-document shipment must pass every check.
import { describe, expect, it } from "vitest";
import { checkInvoiceTotal } from "../invoice-total";
import { checkGrossWeight } from "../gross-weight";
import { checkPackagesCount } from "../packages-count";
import { checkContainerNumbers } from "../container-numbers";
import { cleanShipment } from "./fixtures";

describe("a clean three-document shipment", () => {
  it.each([
    ["checkInvoiceTotal", () => checkInvoiceTotal(cleanShipment, 0)],
    ["checkGrossWeight", () => checkGrossWeight(cleanShipment, 1)],
    ["checkPackagesCount", () => checkPackagesCount(cleanShipment)],
    ["checkContainerNumbers", () => checkContainerNumbers(cleanShipment)],
  ])("%s passes", (_name, runCheck) => {
    const result = runCheck();

    expect(result.status).toBe("PASS");
  });
});
