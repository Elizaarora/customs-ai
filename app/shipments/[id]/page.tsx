import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '../../../src/lib/auth';
import { db } from '../../../src/prisma/db';
import { canExport } from '../../../src/lib/export/export-gate';
import { parseShipmentId } from '../../../src/lib/shipments/shipment-id';
import { AppShell } from '../../../src/components/app-shell';
import { Badge } from '../../../src/components/ui/badge';
import { Button } from '../../../src/components/ui/button';
import { Card } from '../../../src/components/ui/card';
import { Input } from '../../../src/components/ui/input';
import { UploadForm } from '../../../src/components/upload-form';
import { formatLabel } from '../../../src/lib/format-label';
import type { Models } from '../../../src/prisma/contract.d';
import { logout } from '../../login/actions';
import { approveShipment, sendBackShipment, uploadDocument } from './actions';

type DocumentType = Models.public_Document['type'];

const DOCUMENT_TYPES: DocumentType[] = ['INVOICE', 'PACKING_LIST', 'BILL_OF_LADING'];

function extractionBadge(status: Models.public_Document['extractionStatus']) {
  if (status === 'SUCCEEDED') return <Badge status="confirmed">Extracted</Badge>;
  if (status === 'FAILED') return <Badge status="failed">Failed</Badge>;
  return <Badge status="neutral">{formatLabel(status)}</Badge>;
}

export default async function ShipmentPage({ params }: PageProps<'/shipments/[id]'>) {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const { id } = await params;
  const shipmentId = parseShipmentId(id);
  if (shipmentId === null) {
    notFound();
  }

  const shipment = await db.orm.public.Shipment.select('id', 'reference', 'status')
    .where({ id: shipmentId })
    .include('documents', (documents) => documents.select('id', 'type', 'extractionStatus', 'extractionError'))
    .include('approvals', (approvals) => approvals.select('decision', 'comment').orderBy((a) => a.approvedAt.desc()))
    .first();

  if (!shipment) {
    notFound();
  }

  const gate = await canExport(shipmentId);
  const canApprove =
    user.role === 'MANAGER' &&
    gate.reasons.length === 1 &&
    gate.reasons[0] === 'Manager has not approved this shipment';
  const lastDecision = shipment.approvals[0];

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
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">{shipment.reference}</h1>
          {shipment.documents.length > 0 && (
            <Link href={`/shipments/${shipment.id}/review`} className="text-sm font-medium text-accent-700 hover:underline">
              Review fields &amp; checks
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {DOCUMENT_TYPES.map((type) => {
            const document = shipment.documents.find((doc) => doc.type === type);

            return (
              <Card key={type} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium text-neutral-900">{formatLabel(type)}</h2>
                  {document && document.extractionStatus === 'FAILED' && document.extractionError && (
                    <p className="mt-1 text-sm text-danger-fg">{document.extractionError}</p>
                  )}
                </div>

                {document ? (
                  extractionBadge(document.extractionStatus)
                ) : (
                  <UploadForm action={uploadDocument.bind(null, shipment.id, type)} />
                )}
              </Card>
            );
          })}
        </div>

        {lastDecision?.decision === 'SENT_BACK' && (
          <Card className="border-warning-border bg-warning-bg">
            <p className="font-medium text-warning-fg">Sent back by a manager</p>
            <p className="mt-1 text-sm text-warning-fg">{lastDecision.comment}</p>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium text-neutral-900">Export</h2>

          {gate.allowed ? (
            <div className="flex flex-wrap gap-2">
              <a
                href={`/shipments/${shipment.id}/export`}
                className="inline-flex w-fit items-center justify-center rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-700"
              >
                Export CSV
              </a>
              <a
                href={`/shipments/${shipment.id}/export?format=xlsx`}
                className="inline-flex w-fit items-center justify-center rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
              >
                Export Excel
              </a>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {gate.reasons.map((reason) => (
                <li key={reason} className="rounded-md bg-warning-bg px-3 py-1.5 text-sm text-warning-fg">
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {canApprove && (
            <form action={approveShipment.bind(null, shipment.id)}>
              <Button type="submit" variant="secondary">
                Approve
              </Button>
            </form>
          )}

          {user.role === 'MANAGER' && (
            <form action={sendBackShipment.bind(null, shipment.id)} className="flex flex-wrap gap-2">
              <Input name="comment" placeholder="Required: why is this being sent back?" required className="min-w-0 flex-1" />
              <Button type="submit" variant="danger">
                Send back
              </Button>
            </form>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
