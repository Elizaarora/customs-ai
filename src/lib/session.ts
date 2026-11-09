import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';

const encodedSecret = new TextEncoder().encode(process.env.SESSION_SECRET);

type SessionPayload = {
  userId: number;
};

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

// Returns null for a missing, expired, or tampered-with cookie rather than throwing,
// so callers can treat "no session" and "bad session" the same way.
export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ['HS256'] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const token = await encrypt({ userId });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
