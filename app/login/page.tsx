import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { UserX } from 'lucide-react';
import { db } from '../../src/prisma/db';
import { getCurrentUser } from '../../src/lib/auth';
import { Badge } from '../../src/components/ui/badge';
import { Card } from '../../src/components/ui/card';
import { EmptyState } from '../../src/components/ui/empty-state';
import { loginAs } from './actions';

// Checks the current session and reads the live user list, so this page
// always hits the database — it can never render instantly.
export const instant = false;

export default async function LoginPage() {
  // Cache Components would otherwise try to bake this page into a static
  // shell using an empty, placeholder session. Force it to run per-request.
  await connection();

  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect('/');
  }

  const users = await db.orm.public.User.select('id', 'name', 'role').all();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
      {users.length === 0 ? (
        <EmptyState icon={<UserX size={32} />} title="No users seeded yet" hint="Run the seed script to create demo users." />
      ) : (
        <div className="flex w-full max-w-72 flex-col gap-3">
          {users.map((user) => (
            <form key={user.id} action={loginAs.bind(null, user.id)}>
              <button type="submit" className="w-full text-left">
                <Card className="flex items-center justify-between transition-colors hover:border-accent-500">
                  <span className="font-medium text-neutral-900">{user.name}</span>
                  <Badge status="neutral">{user.role}</Badge>
                </Card>
              </button>
            </form>
          ))}
        </div>
      )}
    </main>
  );
}
