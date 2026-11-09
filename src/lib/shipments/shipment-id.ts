import { z } from 'zod';

const ShipmentIdSchema = z.coerce.number().int().positive();

// Every route takes `id` as a raw URL string segment — this is the one place
// that turns it into a validated number, or null for anything else.
export function parseShipmentId(id: string): number | null {
  const result = ShipmentIdSchema.safeParse(id);
  return result.success ? result.data : null;
}
