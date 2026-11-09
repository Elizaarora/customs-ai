import Link from 'next/link';
import { Package } from 'lucide-react';
import { requireRole } from '../src/lib/auth';
import { db } from '../src/prisma/db';
import { AppShell } from '../src/components/app-shell';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { EmptyState } from '../src/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../src/components/ui/table';
import { logout } from './login/actions';
import { createShipment } from './shipments/actions';

export default async function Home() {
  const user = await requireRole(['EXECUTIVE', 'MANAGER']);

  const shipments = await db.orm.public.Shipment.select('id', 'reference', 'status', 'createdAt')
    .include('documents', (documents) => documents.count())
    .orderBy((s) => s.createdAt.desc())
    .all();

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
        <form action={createShipment} className="flex flex-wrap gap-2">
          <Input name="reference" placeholder="Shipment reference, e.g. SHP-24900" required className="min-w-0 flex-1" />
          <Button type="submit">New shipment</Button>
        </form>

        {shipments.length === 0 ? (
          <EmptyState title="No shipments yet" hint="Create one above to get started." icon={<Package size={32} />} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Reference</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Documents</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Link href={`/shipments/${shipment.id}`} className="font-medium text-accent-700 hover:underline">
                        {shipment.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="text-neutral-600">{shipment.status}</TableCell>
                    <TableCell className="text-neutral-600">{shipment.documents} / 3</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
