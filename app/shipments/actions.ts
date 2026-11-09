'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '../../src/prisma/db';
import { requireRole } from '../../src/lib/auth';

const ReferenceSchema = z.string().trim().min(1, 'Reference is required');

export async function createShipment(formData: FormData) {
  await requireRole(['EXECUTIVE', 'MANAGER']);

  const reference = ReferenceSchema.parse(formData.get('reference'));

  const shipment = await db.orm.public.Shipment.create({
    reference,
    status: 'DRAFT',
  });

  redirect(`/shipments/${shipment.id}`);
}
