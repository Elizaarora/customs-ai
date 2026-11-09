import 'server-only';
import { db } from '../../prisma/db';
import { evaluateExportGate, type ExportGateResult } from './evaluate-gate';

// Returns the latest CheckResult per check name for a shipment — CheckResult
// is append-only (see run-checks-for-shipment.ts), so "current" means the
// most recently recorded row for each check.
export async function latestCheckResultsByName(shipmentId: number) {
  const results = await db.orm.public.CheckResult.where({ shipmentId })
    .orderBy((check) => check.createdAt.desc())
    .all();

  const latestByName = new Map<string, (typeof results)[number]>();
  for (const result of results) {
    if (!latestByName.has(result.checkName)) {
      latestByName.set(result.checkName, result);
    }
  }
  return [...latestByName.values()];
}

async function countNeedsReviewFields(shipmentId: number): Promise<number> {
  const documents = await db.orm.public.Document.where({ shipmentId }).select('id').all();
  if (documents.length === 0) return 0;
  const documentIds = documents.map((document) => document.id);

  const fieldTotals = await db.orm.public.ExtractedField
    .where((field) => field.documentId.in(documentIds))
    .where({ status: 'NEEDS_REVIEW' })
    .aggregate((aggregate) => ({ count: aggregate.count() }));

  const lineItemTotals = await db.orm.public.LineItem
    .where((lineItem) => lineItem.documentId.in(documentIds))
    .where({ status: 'NEEDS_REVIEW' })
    .aggregate((aggregate) => ({ count: aggregate.count() }));

  return fieldTotals.count + lineItemTotals.count;
}

// Gathers the live counts hard rule #2 cares about, then hands them to the
// pure evaluator. This is the one function both the export route and the
// approval action call, so they can never disagree about what's blocking.
export async function gatherExportGateInput(shipmentId: number) {
  const shipment = await db.orm.public.Shipment.where({ id: shipmentId })
    .include('documents', (documents) => documents.count())
    .include('approvals', (approvals) => approvals.select('decision'))
    .first();

  if (!shipment) {
    return null;
  }

  const latestChecks = await latestCheckResultsByName(shipmentId);
  // CANNOT_CHECK is already covered by the documentCount condition below —
  // only a real FAILED result needs resolving here.
  const unresolvedFailedCheckCount = latestChecks.filter(
    (check) => check.status === 'FAILED' && !check.resolvedAt,
  ).length;

  // A null decision predates SENT_BACK existing, so it's always an approval.
  // Only an explicit SENT_BACK doesn't count.
  const hasApproval = shipment.approvals.some((approval) => approval.decision !== 'SENT_BACK');

  return {
    documentCount: shipment.documents,
    needsReviewFieldCount: await countNeedsReviewFields(shipmentId),
    unresolvedFailedCheckCount,
    hasApproval,
  };
}

export async function canExport(shipmentId: number): Promise<ExportGateResult> {
  const input = await gatherExportGateInput(shipmentId);
  if (!input) {
    return { allowed: false, reasons: ['Shipment not found'] };
  }
  return evaluateExportGate(input);
}
