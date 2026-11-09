# Deployment

## Run it locally (PowerShell)

Prerequisites: Node.js 24+, a Postgres database (Supabase's free tier works — see
`docs/TDD.md` for how this project's own dev database was set up), and a Gemini
API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

```powershell
# 1. Install dependencies
npm install

# 2. Copy the env file and fill in real values (DATABASE_URL, SESSION_SECRET,
#    GEMINI_API_KEY, NEXT_SERVER_ACTIONS_ENCRYPTION_KEY — see "Environment
#    variables" below for what each one is)
Copy-Item .env.example .env
notepad .env

# 3. Create the database tables from the schema
npx prisma db init

# 4. Seed the two demo users (safe to re-run any time)
npm run db:seed

# 5. Generate the sample PDFs, then seed the brief's named shipments
#    (SHP-24811 weight-mismatch, SHP-24812 cannot-check, a clean one) with
#    real fields and real computed cross-check results (safe to re-run)
npm run fixtures:pdfs
npm run db:seed:shipments

# 6. Start the dev server
npm run dev
```

Open http://localhost:3000, pick a demo user on the login screen (see
"Demo logins" below), and you're in.

Running the test suite: `npm test`. Typecheck: `npx tsc --noEmit`. Lint: `npm run lint`.

## How it's deployed

**App: Vercel.** This is a Next.js (App Router) app — Vercel is the
zero-config deploy target for it. Connect the GitHub repo in the Vercel
dashboard, set the environment variables listed below in the project's
Settings → Environment Variables, and every push to the main branch deploys.

**Database: Supabase Postgres.** The same Supabase project used in
development, or a separate production project — either way it's the
`DATABASE_URL` from that project's connection string.

**File storage: Supabase Storage.** Set `STORAGE_DRIVER=supabase` in
production (it defaults to local disk, which doesn't persist across Vercel's
serverless invocations — disk storage only ever worked for local dev). Create
a **private** bucket in the Supabase dashboard (Storage → New bucket, toggle
"Public" off) and point `SUPABASE_STORAGE_BUCKET` at its name. Uploaded
documents are only ever reachable through this app's own authenticated route
(`/shipments/[id]/documents/[type]`), never directly from the bucket.

**One-time production setup**, run once from your own machine with
`DATABASE_URL` pointed at the production database (not from inside the
Vercel build — see why in `docs/TDD.md`'s "what I'd do next" section):

```powershell
$env:DATABASE_URL = "<production connection string>"
$env:STORAGE_DRIVER = "supabase"   # so seeded documents land in the real bucket, not local disk
$env:SUPABASE_URL = "<production project URL>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<production service-role key>"
$env:SUPABASE_STORAGE_BUCKET = "<production bucket name>"
npm run db:deploy   # applies migrations, seeds the 2 demo users and the sample shipments
```

Re-run `npm run db:deploy` after any schema change that ships a new migration.

## Environment variables

Names only — see `.env.example` for what each one does and where to get it.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Always | Postgres connection string |
| `SESSION_SECRET` | Always | Signs the login session cookie |
| `GEMINI_API_KEY` | Always | Document extraction (Gemini API) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Always | Works around a bug in this Next.js version's auto-generated key |
| `STORAGE_DRIVER` | Always | `disk` (local dev) or `supabase` (production) |
| `SUPABASE_URL` | When `STORAGE_DRIVER=supabase` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | When `STORAGE_DRIVER=supabase` | Server-only key for Storage access |
| `SUPABASE_STORAGE_BUCKET` | When `STORAGE_DRIVER=supabase` | Bucket name for uploaded documents |

## Demo logins

There's no password — the login screen lists the seeded users by name and
role; clicking one signs you in as them (see `docs/DECISIONS.md` for why).

| Name | Email (for reference only — not used to log in) | Role |
|---|---|---|
| Priya Shah | exec@example.com | EXECUTIVE |
| Arjun Mehta | manager@example.com | MANAGER |

Both are fake accounts created by `npm run db:seed` / `npm run db:deploy` —
there is no real user data anywhere in this project.
