import Link from 'next/link';
import { requireRole } from '../../../src/lib/auth';
import { computeAccuracyReport } from '../../../src/lib/reports/accuracy';
import { AppShell } from '../../../src/components/app-shell';
import { Button } from '../../../src/components/ui/button';
import { Card } from '../../../src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../src/components/ui/table';
import { logout } from '../../login/actions';

function accuracyPercent(total: number, edited: number): string {
  if (total === 0) return '—';
  return `${Math.round(((total - edited) / total) * 100)}%`;
}

export default async function AccuracyReportPage() {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);
  const { byField, bySupplier } = await computeAccuracyReport();

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
          <h1 className="text-2xl font-semibold text-neutral-900">Accuracy report</h1>
          <Link href="/" className="text-sm font-medium text-accent-700 hover:underline">
            Shipment list
          </Link>
        </div>

        <p className="text-sm text-neutral-500">
          &ldquo;Accuracy&rdquo; here means a field whose first extracted value was never corrected — not a
          measurement against verified ground truth, since this project has no reference dataset
          to compare against.
        </p>

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium text-neutral-900">By field</h2>
          <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>Field</TableCell>
                <TableCell header>Extracted</TableCell>
                <TableCell header>Edited</TableCell>
                <TableCell header>Accuracy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {byField.map((row) => (
                <TableRow key={row.fieldName}>
                  <TableCell>{row.fieldName}</TableCell>
                  <TableCell>{row.total}</TableCell>
                  <TableCell>{row.edited}</TableCell>
                  <TableCell>{accuracyPercent(row.total, row.edited)}</TableCell>
                </TableRow>
              ))}
              {byField.length === 0 && (
                <TableRow>
                  <TableCell className="text-neutral-500">No extracted fields yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-medium text-neutral-900">By supplier</h2>
          <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>Supplier</TableCell>
                <TableCell header>Extracted</TableCell>
                <TableCell header>Edited</TableCell>
                <TableCell header>Accuracy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bySupplier.map((row) => (
                <TableRow key={row.supplier}>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell>{row.total}</TableCell>
                  <TableCell>{row.edited}</TableCell>
                  <TableCell>{accuracyPercent(row.total, row.edited)}</TableCell>
                </TableRow>
              ))}
              {bySupplier.length === 0 && (
                <TableRow>
                  <TableCell className="text-neutral-500">No extracted fields yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
