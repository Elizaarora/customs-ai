import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { db } from '../prisma/db';
import { decryptSession, readSessionCookie } from './session';
import type { Models } from '../prisma/contract.d';

type Role = Models.public_User['role'];

// cache() dedupes repeated calls within one render pass, not across requests,
// so every request still re-reads the cookie and re-queries the user.
export const getCurrentUser = cache(async () => {
  // Cache Components would otherwise try to bake this into a static shell
  // using an empty, placeholder session. Force it to run per-request.
  await connection();

  const token = await readSessionCookie();
  const session = await decryptSession(token);
  if (!session) return null;

  return db.orm.public.User.first({ id: session.userId });
});

// The one function every route, page, and server action calls to check who's
// asking and what they're allowed to do. See hard rule #6 in CLAUDE.md.
export async function requireRole(allowed: Role | Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(user.role)) {
    redirect('/login');
  }

  return user;
}
