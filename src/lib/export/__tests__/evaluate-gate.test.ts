import { describe, expect, it } from "vitest";
import { evaluateExportGate } from "../evaluate-gate";

const ALL_CLEAR = {
  documentCount: 3,
  needsReviewFieldCount: 0,
  unresolvedFailedCheckCount: 0,
  hasApproval: true,
};

describe("evaluateExportGate", () => {
  it("allows export when all four conditions are met", () => {
    const result = evaluateExportGate(ALL_CLEAR);

    expect(result).toEqual({ allowed: true, reasons: [] });
  });

  it("blocks when a document is missing", () => {
    const result = evaluateExportGate({ ...ALL_CLEAR, documentCount: 2 });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(["Missing documents: 2/3 uploaded"]);
  });

  it("blocks when a field still needs review", () => {
    const result = evaluateExportGate({ ...ALL_CLEAR, needsReviewFieldCount: 1 });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(["1 field(s) still need review"]);
  });

  it("blocks when a failed check is unresolved", () => {
    const result = evaluateExportGate({ ...ALL_CLEAR, unresolvedFailedCheckCount: 1 });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(["1 failed check(s) unresolved"]);
  });

  it("blocks when there is no manager approval", () => {
    const result = evaluateExportGate({ ...ALL_CLEAR, hasApproval: false });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(["Manager has not approved this shipment"]);
  });

  it("reports every blocking reason at once, never just the first", () => {
    const result = evaluateExportGate({
      documentCount: 1,
      needsReviewFieldCount: 2,
      unresolvedFailedCheckCount: 1,
      hasApproval: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasons).toHaveLength(4);
  });
});
