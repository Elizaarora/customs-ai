// Seeds the two demo users the login screen lets you pick between.
// Run with: npm run db:seed (local) or npm run db:deploy (migrate + seed, production).
// Safe to re-run anywhere, including production: it only ever upserts these two
// fixed, fake accounts by email — no deletes, no other table touched.
import { db } from './db';

async function main() {
  await db.orm.public.User.upsert({
    create: { email: 'exec@example.com', name: 'Priya Shah', role: 'EXECUTIVE' },
    update: { name: 'Priya Shah', role: 'EXECUTIVE' },
  });

  await db.orm.public.User.upsert({
    create: { email: 'manager@example.com', name: 'Arjun Mehta', role: 'MANAGER' },
    update: { name: 'Arjun Mehta', role: 'MANAGER' },
  });

  console.log('Seeded 2 users: exec@example.com (EXECUTIVE), manager@example.com (MANAGER)');
}

main();
