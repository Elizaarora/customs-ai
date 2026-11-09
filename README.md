# Customs AI

A document extraction and cross-check tool for a customs broker's documentation
executives. Upload a shipment's invoice, packing list, and bill of lading; an
AI model extracts fields with confidence scores; the app cross-checks the
three documents against each other; a human confirms every low-confidence
field and every failed check; a manager approves; only then can the shipment
be exported.

**Live demo:** https://customs-ai-ten.vercel.app
**Full design doc:** [docs/TDD.md](docs/TDD.md)

## Demo logins

No password — pick a user on the login screen:

| Name | Role |
|---|---|
| Priya Shah | Executive |
| Arjun Mehta | Manager |

## What it does

- **Shipment list** — create shipments, see status and document count at a glance.
- **Upload** — invoice, packing list, bill of lading, one slot each, validated server-side.
- **AI extraction** — Gemini pulls out parties, invoice/document number, date,
  currency, Incoterm, line items with HSN, packages, weights, and container
  numbers, each with a confidence score. Malformed output, an API error, or a
  failed extraction all fall through to manual entry — never a crash, never a
  silent pass.
- **Side-by-side review** — the document on the left, extracted fields on the
  right, low-confidence fields visibly flagged, one click to confirm or edit.
- **Cross-checks** — invoice total vs. line-item sum, packages and gross
  weight and container numbers across all three documents. Every check is a
  pure function with its own tests (`src/lib/checks/`), run before any
  implementation existed.
- **Manager approval & send-back** — a shipment can only be exported once
  every document is present, every low-confidence field is confirmed, every
  failed check is resolved (fixed or overridden with a mandatory note), and a
  manager has approved. This gate is enforced **server-side**, in the export
  route itself — a disabled button in the UI is not the real guard.
- **Export** — CSV or Excel (`.xlsx`), same gate either way.
- **Accuracy report** — per field and per supplier, how often the first
  extracted value needed correcting.
- **Edit history** — every confirmation, edit, override, and manual entry is
  logged (who, when, old value, new value) and shown on the review screen.

## Stack

Next.js (App Router) + TypeScript, Tailwind, Prisma (contract ORM) + Postgres,
Zod, Vitest. File storage behind a swappable interface — local disk in dev,
Supabase Storage in production.

## Running it locally

See [deployment.md](deployment.md) for the full step-by-step (including how
to seed the brief's named sample shipments). Short version:

```powershell
npm install
Copy-Item .env.example .env   # then fill in real values
npx prisma db init
npm run db:seed
npm run fixtures:pdfs
npm run db:seed:shipments
npm run dev
```

Then open http://localhost:3000.

## Testing

```powershell
npm test            # Vitest — cross-check logic and the export gate
npx tsc --noEmit     # typecheck
npm run lint         # ESLint
```

## Project structure

```
app/                   Routes (App Router) — one folder per screen/action
src/lib/checks/         Pure cross-check functions, no DB, no I/O — tests live beside them
src/lib/extraction/     AI extraction (Gemini), Zod-validated
src/lib/export/         Export gate logic, CSV/Excel builders
src/lib/storage/        Storage driver interface (disk / Supabase)
src/components/         Design system (tokens in app/globals.css) and shared UI
src/prisma/             Schema, migrations, seed scripts
docs/DECISIONS.md       Every assumption and tradeoff, logged as it was made
docs/TDD.md             Full technical design doc
```

## Known limitations

Stated plainly, not glossed over — see `docs/TDD.md` §10 for the full version:

- **India data residency, a contractually no-train AI provider, and full
  DPDP consent/legal work are not satisfied by this demo.** None of these
  are code-level problems — they need a real paid account/contract, a cloud
  region decision, and legal review, none of which a coding exercise can
  produce.
- **No real accuracy measurement.** The accuracy report is a proxy (did the
  first extracted value ever get corrected), not a measurement against
  verified ground truth — there's no real historical dataset to compare
  against, only synthetic sample data (hard rule: fake data only).
- Bilingual/non-Latin-script documents were not attempted (the fixture
  generator's font has no Devanagari glyphs).
