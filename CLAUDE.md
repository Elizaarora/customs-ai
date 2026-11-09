# Project: Customs document extraction and cross-check tool

## What this is
A web app for a customs broker (Nhava Sheva). Documentation executives upload a
shipment's invoice, packing list and bill of lading. A vision AI model extracts
fields with confidence scores. The app cross-checks the three documents. A
person must confirm every low-confidence field and every field in a failed
cross-check. The manager approves. Only then can the shipment be exported as CSV.

## Core slice (build ONLY this)
Shipment list, document upload, AI extraction, side-by-side review with
cross-checks, CSV export. Roles: executive, manager. Desktop only.

## Out of scope (do not build, do not suggest)
Customs portal filing, HSN classification, duty calculation, importer portal,
accuracy report, Hindi/Marathi, mobile layout, payments, real email/WhatsApp.

## Stack
Next.js (App Router) + TypeScript, Tailwind, Prisma + Postgres, Zod, Vitest.
Files stored on local disk in dev, object storage in prod (behind a storage module).

## Hard rules
1. Cross-check logic lives in `src/lib/checks/` as PURE functions (no DB, no I/O)
   with Vitest tests. Tests are written before implementation.
2. The export gate is enforced SERVER-SIDE in the export route. UI disabling is
   not enough. Export is blocked unless: all 3 documents are present, no field is
   unconfirmed-low-confidence, no failed check is unresolved, and a manager approved.
3. All AI output is validated with Zod. Malformed output, API errors, or an
   unreadable page route that document to manual entry. Never crash, never
   silently pass.
4. Every field edit or confirmation writes a FieldEdit row (who, when, old, new).
5. No secrets in the repo. Env var names only in `.env.example`. Fake data only.
6. Validate all inputs on the server. Check role on every route and action.
7. Small commits, conventional messages (feat:, fix:, test:, docs:).
8. Any assumption not in the brief goes into `docs/DECISIONS.md` the moment
   you make it, labelled "ASSUMPTION".

## Working style
Before writing code for a feature, give a short plan and wait for approval.
One feature per task. Do not add features I did not ask for. Keep functions
small and readable, because I must explain every line in an interview.

## Design
Minimal: white space, one accent colour, a restrained neutral palette, clear
type scale. Define design tokens first. Every element on screen needs a purpose.
Review screen: document on the left, fields on the right, uncertain fields
obvious at a glance, every action one click away.

## Brief facts to test against
- SHP-24811: invoice and packing list both 2400 x LED panel light 40W at USD 6.80
  (total USD 16,320). Gross weight 3120 kg (invoice) vs 3165 kg (packing list).
  Must FAIL the weight check.
- SHP-24812: invoice only (180 x Steel ball valve DN50 at EUR 42.50 = EUR 7,650).
  Packing list and bill of lading missing. Must report "cannot cross-check".