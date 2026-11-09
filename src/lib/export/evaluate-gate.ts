// Pure — no DB, no I/O. Hard rule #2's four conditions, as plain data in and
// a decision out, so it's testable without a database. See export-gate.ts
// for the DB-reading wrapper that gathers this input.

export const REQUIRED_DOCUMENT_COUNT = 3;

export interface ExportGateInput {
  documentCount: number;
  needsReviewFieldCount: number;
  unresolvedFailedCheckCount: number;
  hasApproval: boolean;
}

export interface ExportGateResult {
  allowed: boolean;
  reasons: string[];
}

export function evaluateExportGate(input: ExportGateInput): ExportGateResult {
  const reasons: string[] = [];

  if (input.documentCount < REQUIRED_DOCUMENT_COUNT) {
    reasons.push(`Missing documents: ${input.documentCount}/${REQUIRED_DOCUMENT_COUNT} uploaded`);
  }
  if (input.needsReviewFieldCount > 0) {
    reasons.push(`${input.needsReviewFieldCount} field(s) still need review`);
  }
  if (input.unresolvedFailedCheckCount > 0) {
    reasons.push(`${input.unresolvedFailedCheckCount} failed check(s) unresolved`);
  }
  if (!input.hasApproval) {
    reasons.push('Manager has not approved this shipment');
  }

  return { allowed: reasons.length === 0, reasons };
}
