import 'server-only';
import { db } from '../prisma/db';
import { checkContainerNumbers } from './checks/container-numbers';
import { checkGrossWeight } from './checks/gross-weight';
import { checkInvoiceTotal } from './checks/invoice-total';
import { checkPackagesCount } from './checks/packages-count';
import { GROSS_WEIGHT_TOLERANCE_PERCENT, INVOICE_TOTAL_TOLERANCE_ABSOLUTE } from './checks/tolerances';
import type { ShipmentDocuments } from './checks/types';
import { fieldValue } from './documents/field-value';
import type { Models } from '../prisma/contract.d';

type ExtractedFieldRow = Pick<Models.public_ExtractedField, 'id' | 'name' | 'value'>;
type LineItemValue = Pick<Models.public_LineItem, 'description' | 'quantity' | 'unitPrice' | 'lineTotal'>;

type DocumentWithFields = {
  type: Models.public_Document['type'];
  fields: ExtractedFieldRow[];
  lineItems: LineItemValue[];
};

function fieldNumber(fields: ExtractedFieldRow[], name: string): number {
  return Number(fieldValue(fields, name));
}

function fieldId(fields: ExtractedFieldRow[], name: string): number | undefined {
  return fields.find((field) => field.name === name)?.id;
}

// Turns the DB rows for one shipment into the plain-data shape the pure check
// functions expect — this is the only place that bridges the two.
function buildShipmentDocuments(documents: DocumentWithFields[]): ShipmentDocuments {
  const invoice = documents.find((document) => document.type === 'INVOICE');
  const packingList = documents.find((document) => document.type === 'PACKING_LIST');
  const billOfLading = documents.find((document) => document.type === 'BILL_OF_LADING');

  return {
    invoice: invoice && {
      invoiceTotal: fieldNumber(invoice.fields, 'invoiceTotal'),
      grossWeightKg: fieldNumber(invoice.fields, 'grossWeightKg'),
      packagesCount: fieldNumber(invoice.fields, 'packagesCount'),
      containerNumber: fieldValue(invoice.fields, 'containerNumber') ?? '',
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    },
    packingList: packingList && {
      grossWeightKg: fieldNumber(packingList.fields, 'grossWeightKg'),
      packagesCount: fieldNumber(packingList.fields, 'packagesCount'),
      containerNumber: fieldValue(packingList.fields, 'containerNumber') ?? '',
    },
    billOfLading: billOfLading && {
      packagesCount: fieldNumber(billOfLading.fields, 'packagesCount'),
      containerNumber: fieldValue(billOfLading.fields, 'containerNumber') ?? '',
    },
  };
}

// The ExtractedField ids each check's outcome actually depends on, so a
// FAILED result can flag exactly those fields NEEDS_REVIEW and the review
// screen can point a user straight at them. Only fields that exist are kept.
function involvedFieldIdsFor(checkName: string, documents: DocumentWithFields[]): number[] {
  const invoice = documents.find((document) => document.type === 'INVOICE');
  const packingList = documents.find((document) => document.type === 'PACKING_LIST');
  const billOfLading = documents.find((document) => document.type === 'BILL_OF_LADING');

  const ids: (number | undefined)[] = (() => {
    switch (checkName) {
      case 'INVOICE_TOTAL':
        return [invoice && fieldId(invoice.fields, 'invoiceTotal')];
      case 'GROSS_WEIGHT':
        return [invoice && fieldId(invoice.fields, 'grossWeightKg'), packingList && fieldId(packingList.fields, 'grossWeightKg')];
      case 'PACKAGES_COUNT':
        return [
          invoice && fieldId(invoice.fields, 'packagesCount'),
          packingList && fieldId(packingList.fields, 'packagesCount'),
          billOfLading && fieldId(billOfLading.fields, 'packagesCount'),
        ];
      case 'CONTAINER_NUMBERS':
        return [
          invoice && fieldId(invoice.fields, 'containerNumber'),
          packingList && fieldId(packingList.fields, 'containerNumber'),
          billOfLading && fieldId(billOfLading.fields, 'containerNumber'),
        ];
      default:
        return [];
    }
  })();

  return ids.filter((id): id is number => typeof id === 'number');
}

// Runs every cross-check against a shipment's current field values and
// records a fresh CheckResult per check (append-only, like FieldEdit and
// Approval — history survives even as fields get corrected). A prior
// resolution does not carry forward to the new row: if the underlying data
// changed enough to re-run checks, a human should look at it again.
// CANNOT_CHECK is persisted too, not skipped — the brief's own gate rule
// ("CANNOT_CHECK... is never counted as passed") needs a real stored state
// to be auditable, not an absence.
export async function runChecksForShipment(shipmentId: number): Promise<void> {
  const documents = await db.orm.public.Document.where({ shipmentId })
    .include('fields', (fields) => fields)
    .include('lineItems', (lineItems) => lineItems)
    .all();

  const shipmentDocuments = buildShipmentDocuments(documents);

  const outcomes = [
    { checkName: 'INVOICE_TOTAL', outcome: checkInvoiceTotal(shipmentDocuments, INVOICE_TOTAL_TOLERANCE_ABSOLUTE) },
    { checkName: 'GROSS_WEIGHT', outcome: checkGrossWeight(shipmentDocuments, GROSS_WEIGHT_TOLERANCE_PERCENT) },
    { checkName: 'PACKAGES_COUNT', outcome: checkPackagesCount(shipmentDocuments) },
    { checkName: 'CONTAINER_NUMBERS', outcome: checkContainerNumbers(shipmentDocuments) },
  ] as const;

  for (const { checkName, outcome } of outcomes) {
    const involvedFieldIds = involvedFieldIdsFor(checkName, documents);
    const status = outcome.status === 'PASS' ? 'PASSED' : outcome.status === 'FAIL' ? 'FAILED' : 'CANNOT_CHECK';

    await db.orm.public.CheckResult.create({
      shipmentId,
      checkName,
      status,
      details: outcome.details,
      involvedFieldIds,
    });

    // A failed check means every field it depends on needs a human look —
    // the brief's own rule, not just a UI nicety.
    if (status === 'FAILED' && involvedFieldIds.length > 0) {
      await db.orm.public.ExtractedField.where((field) => field.id.in(involvedFieldIds)).updateAll({
        status: 'NEEDS_REVIEW',
      });
    }
  }
}
