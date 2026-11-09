import Link from 'next/link';
import { FileText, History } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireRole } from '../../../../src/lib/auth';
import { db } from '../../../../src/prisma/db';
import { latestCheckResultsByName } from '../../../../src/lib/export/export-gate';
import { parseShipmentId } from '../../../../src/lib/shipments/shipment-id';
import { EXPECTED_FIELDS } from '../../../../src/lib/extraction/field-config';
import { AppShell } from '../../../../src/components/app-shell';
import { Badge } from '../../../../src/components/ui/badge';
import { Button } from '../../../../src/components/ui/button';
import { Card } from '../../../../src/components/ui/card';
import { EmptyState } from '../../../../src/components/ui/empty-state';
import { Input } from '../../../../src/components/ui/input';
import { cn } from '../../../../src/components/ui/cn';
import { formatLabel } from '../../../../src/lib/format-label';
import type { Models } from '../../../../src/prisma/contract.d';
import { logout } from '../../../login/actions';
import { confirmField, confirmLineItem, editField, manualEntry, overrideCheck } from './actions';

type DocumentType = Models.public_Document['type'];

const DOCUMENT_TYPES: DocumentType[] = ['INVOICE', 'PACKING_LIST', 'BILL_OF_LADING'];
const CHECK_NAMES = ['INVOICE_TOTAL', 'GROSS_WEIGHT', 'PACKAGES_COUNT', 'CONTAINER_NUMBERS'] as const;

function needsReviewClass(flagged: boolean) {
  return flagged ? 'border-warning-border bg-warning-bg' : 'border-neutral-200';
}

function FieldBadge({ status, confidence }: { status: string; confidence: number | null }) {
  const label = confidence !== null ? `${formatLabel(status)} · ${Math.round(confidence * 100)}%` : formatLabel(status);
  return (
    <Badge status={status === 'NEEDS_REVIEW' ? 'needs-review' : status === 'CONFIRMED' || status === 'MANUAL' ? 'confirmed' : 'neutral'}>
      {label}
    </Badge>
  );
}

export default async function ReviewPage({
  params,
  searchParams,
}: PageProps<'/shipments/[id]/review'>) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const { id } = await params;
  const { type: requestedType } = await searchParams;
  const shipmentId = parseShipmentId(id);
  if (shipmentId === null) {
    notFound();
  }

  const shipment = await db.orm.public.Shipment.select('id', 'reference')
    .where({ id: shipmentId })
    .include('documents', (documents) =>
      documents
        .select('id', 'type', 'extractionStatus', 'extractionError')
        .include('fields', (fields) =>
          fields
            .select('id', 'name', 'value', 'confidence', 'status')
            .include('edits', (edits) =>
              edits
                .select('id', 'oldValue', 'newValue', 'type', 'createdAt')
                .include('user', (u) => u.select('name'))
                .orderBy((e) => e.createdAt.desc()),
            ),
        )
        .include('lineItems', (lineItems) =>
          lineItems
            .select('id', 'description', 'hsn', 'quantity', 'unitPrice', 'lineTotal', 'confidence', 'status')
            .include('edits', (edits) =>
              edits
                .select('id', 'oldValue', 'newValue', 'type', 'createdAt')
                .include('user', (u) => u.select('name'))
                .orderBy((e) => e.createdAt.desc()),
            ),
        ),
    )
    .first();

  if (!shipment) {
    notFound();
  }

  const checks = await latestCheckResultsByName(shipmentId);
  const checksByName = new Map(checks.map((check) => [check.checkName, check]));

  const editHistory = shipment.documents
    .flatMap((document) => [
      ...document.fields.flatMap((field) =>
        field.edits.map((edit) => ({ ...edit, documentType: document.type, label: field.name })),
      ),
      ...document.lineItems.flatMap((item) =>
        item.edits.map((edit) => ({ ...edit, documentType: document.type, label: `Line item — ${item.description}` })),
      ),
    ])
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const uploadedTypes = shipment.documents.map((document) => document.type);
  const requested = Array.isArray(requestedType) ? requestedType[0] : requestedType;
  const activeType =
    requested && uploadedTypes.includes(requested as DocumentType) ? (requested as DocumentType) : uploadedTypes[0];

  const activeDocument = shipment.documents.find((document) => document.type === activeType);
  const needsManualEntry = activeDocument?.extractionStatus === 'FAILED' && activeDocument.fields.length === 0;

  return (
    <AppShell
      user={user}
      signOutAction={
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">Review — {shipment.reference}</h1>
          <div className="flex flex-wrap gap-4">
            <Link href="/reports/accuracy" className="text-sm font-medium text-accent-700 hover:underline">
              Accuracy report
            </Link>
            <Link href={`/shipments/${shipmentId}`} className="text-sm font-medium text-accent-700 hover:underline">
              Back to shipment
            </Link>
          </div>
        </div>

        {shipment.documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title="No documents uploaded yet"
            hint="Upload the invoice, packing list and bill of lading first."
            action={
              <Link href={`/shipments/${shipmentId}`} className="text-sm font-medium text-accent-700 hover:underline">
                Go to shipment
              </Link>
            }
          />
        ) : (
          <>
            <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200">
              {DOCUMENT_TYPES.filter((type) => uploadedTypes.includes(type)).map((type) => (
                <Link
                  key={type}
                  href={`/shipments/${shipmentId}/review?type=${type}`}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium',
                    type === activeType
                      ? 'border-b-2 border-accent-600 text-accent-700'
                      : 'text-neutral-500 hover:text-neutral-900',
                  )}
                >
                  {formatLabel(type)}
                </Link>
              ))}
            </nav>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <embed
                src={`/shipments/${shipmentId}/documents/${activeType}`}
                className="h-[50vh] w-full rounded-md border border-neutral-200 lg:h-[700px]"
                title={`${formatLabel(activeType)} document`}
              />

              <div className="flex flex-col gap-3 lg:overflow-y-auto">
                {needsManualEntry && activeDocument && (
                  <Card className="flex flex-col gap-3 border-danger-border bg-danger-bg">
                    <div>
                      <p className="font-medium text-danger-fg">Extraction failed — manual entry required</p>
                      {activeDocument.extractionError && (
                        <p className="mt-1 text-sm text-danger-fg">{activeDocument.extractionError}</p>
                      )}
                    </div>
                    <form
                      action={manualEntry.bind(null, shipmentId, activeDocument.id)}
                      className="flex flex-col gap-2"
                    >
                      {EXPECTED_FIELDS[activeType].map((name) => (
                        <label key={name} className="flex flex-col gap-1 text-sm text-neutral-700">
                          {name}
                          <Input name={name} placeholder="Leave blank if not applicable" />
                        </label>
                      ))}
                      <Button type="submit" className="mt-2 w-fit">
                        Save manual entry
                      </Button>
                    </form>
                  </Card>
                )}

                {activeDocument?.fields.map((field) => (
                  <Card key={field.id} className={needsReviewClass(field.status === 'NEEDS_REVIEW')}>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{field.name}</span>
                      <FieldBadge status={field.status} confidence={field.confidence} />
                    </div>

                    {field.status === 'CONFIRMED' || field.status === 'MANUAL' ? (
                      <p className="mt-1 text-sm text-neutral-900">{field.value}</p>
                    ) : (
                      <form action={editField.bind(null, shipmentId, field.id)} className="mt-1 flex flex-wrap gap-2">
                        <Input name="value" defaultValue={field.value} className="min-w-0 flex-1" />
                        <Button type="submit" variant="secondary">
                          Save
                        </Button>
                      </form>
                    )}

                    {field.status === 'NEEDS_REVIEW' && (
                      <form action={confirmField.bind(null, shipmentId, field.id)} className="mt-2">
                        <Button type="submit" variant="ghost">
                          Confirm as-is
                        </Button>
                      </form>
                    )}
                  </Card>
                ))}

                {activeDocument?.lineItems.map((item) => (
                  <Card key={item.id} className={needsReviewClass(item.status === 'NEEDS_REVIEW')}>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>Line item{item.hsn ? ` · HSN ${item.hsn}` : ''}</span>
                      <FieldBadge status={item.status} confidence={item.confidence} />
                    </div>
                    <p className="mt-1 text-sm tabular-nums text-neutral-900">
                      {item.description} — {item.quantity} × {item.unitPrice} = {item.lineTotal}
                    </p>

                    {item.status === 'NEEDS_REVIEW' && (
                      <form action={confirmLineItem.bind(null, shipmentId, item.id)} className="mt-2">
                        <Button type="submit" variant="ghost">
                          Confirm as-is
                        </Button>
                      </form>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        <Card className="flex flex-col gap-2">
          <h2 className="font-medium text-neutral-900">Cross-checks</h2>
          {CHECK_NAMES.map((checkName) => {
            const check = checksByName.get(checkName);
            const status = check?.status ?? 'CANNOT_CHECK';
            const failed = status === 'FAILED';

            return (
              <div key={checkName} className={cn('rounded-md border p-3 text-sm', needsReviewClass(failed))}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{formatLabel(checkName)}</span>
                  <Badge status={status === 'PASSED' ? 'confirmed' : status === 'FAILED' ? 'failed' : 'neutral'}>
                    {status === 'FAILED' && check?.resolvedAt ? 'Failed (overridden)' : formatLabel(status)}
                  </Badge>
                </div>
                {check && <p className="mt-1 text-neutral-600">{check.details}</p>}
                {check?.resolutionNote && (
                  <p className="mt-1 text-sm text-neutral-500">Override note: {check.resolutionNote}</p>
                )}
                {check && failed && !check.resolvedAt && (
                  <form action={overrideCheck.bind(null, shipmentId, check.id)} className="mt-2 flex flex-wrap gap-2">
                    <Input name="note" placeholder="Required: why is this being overridden?" required className="min-w-0 flex-1" />
                    <Button type="submit" variant="secondary">
                      Override
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium text-neutral-900">Edit history</h2>
          {editHistory.length === 0 ? (
            <EmptyState
              icon={<History size={32} />}
              title="No edits yet"
              hint="Confirmations, edits, and overrides will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {editHistory.map((edit) => (
                <li key={edit.id} className="border-b border-neutral-100 pb-3 text-sm last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-neutral-900">
                      {formatLabel(edit.documentType)} — {edit.label}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {edit.user?.name ?? 'Unknown user'} · {edit.createdAt.toLocaleString()}
                      {edit.type && ` · ${formatLabel(edit.type)}`}
                    </span>
                  </div>
                  <p className="mt-1 text-neutral-600">
                    {edit.oldValue ?? '—'} <span className="text-neutral-400">→</span> {edit.newValue}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
