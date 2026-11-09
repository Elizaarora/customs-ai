import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { requireRole } from '../../../src/lib/auth';
import { Badge } from '../../../src/components/ui/badge';
import { Button } from '../../../src/components/ui/button';
import { Card } from '../../../src/components/ui/card';
import { EmptyState } from '../../../src/components/ui/empty-state';
import { ErrorState } from '../../../src/components/ui/error-state';
import { Input } from '../../../src/components/ui/input';
import { Select } from '../../../src/components/ui/select';
import { Skeleton } from '../../../src/components/ui/skeleton';
import { Spinner } from '../../../src/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../src/components/ui/table';
import { Tabs } from '../../../src/components/ui/tabs';
import { ToastProvider } from '../../../src/components/ui/toast';
import { DialogDemo, ToastDemo, TooltipDemo } from './interactive';

export const instant = false;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">{title}</h2>
      <Card className="flex flex-col gap-4">{children}</Card>
    </section>
  );
}

export default async function DevUiPage() {
  await requireRole(['EXECUTIVE', 'MANAGER']);

  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
        <h1 className="text-2xl font-semibold text-neutral-900">Design system</h1>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Inputs & select">
          <div className="flex max-w-sm flex-col gap-3">
            <Input placeholder="Shipment reference" />
            <Input placeholder="Invalid value" error defaultValue="not a number" />
            <Select defaultValue="INVOICE">
              <option value="INVOICE">Invoice</option>
              <option value="PACKING_LIST">Packing list</option>
              <option value="BILL_OF_LADING">Bill of lading</option>
            </Select>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge status="neutral">AUTO</Badge>
            <Badge status="needs-review">NEEDS REVIEW</Badge>
            <Badge status="failed">FAILED</Badge>
            <Badge status="confirmed">CONFIRMED</Badge>
          </div>
        </Section>

        <Section title="Table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>Field</TableCell>
                <TableCell header>Value</TableCell>
                <TableCell header>Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>grossWeightKg</TableCell>
                <TableCell>3120</TableCell>
                <TableCell>96%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>containerNumber</TableCell>
                <TableCell>HLXU9988776</TableCell>
                <TableCell>62%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Tabs">
          <Tabs
            items={[
              { value: 'invoice', label: 'Invoice', content: <p className="text-sm">Invoice panel content.</p> },
              { value: 'packing-list', label: 'Packing list', content: <p className="text-sm">Packing list panel content.</p> },
            ]}
          />
        </Section>

        <Section title="Dialog">
          <DialogDemo />
        </Section>

        <Section title="Toast">
          <ToastDemo />
        </Section>

        <Section title="Tooltip">
          <TooltipDemo />
        </Section>

        <Section title="Spinner">
          <Spinner />
        </Section>

        <Section title="Skeleton">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon={<Inbox size={32} />}
            title="No shipments yet"
            hint="Create one to get started."
            action={<Button>New shipment</Button>}
          />
        </Section>

        <Section title="Error state">
          <ErrorState
            message="Could not load this shipment."
            retry={
              <Button variant="secondary">
                <AlertTriangle size={14} /> Retry
              </Button>
            }
          />
        </Section>
      </main>
    </ToastProvider>
  );
}
