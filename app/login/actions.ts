'use server';

import { redirect } from 'next/navigation';
import { db } from '../../src/prisma/db';
import { createSession, deleteSession } from '../../src/lib/session';

// There's no password: picking a seeded user from the login screen is the
// entire sign-in flow. See docs/DECISIONS.md for why.
export async function loginAs(userId: number) {
  const user = await db.orm.public.User.first({ id: userId });
  if (!user) {
    throw new Error('Unknown user');
  }

  await createSession(user.id);
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
