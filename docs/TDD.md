# Technical Design Document — Customs Document Extraction & Cross-Check Tool

**GitHub**: https://github.com/Elizaarora/customs-ai

**Status**: working demo, fake data only. See "What this does not satisfy" at the
bottom before reading this as a production readiness claim.

---

## 1. What this is

A tool for a customs broker's documentation executives: upload a shipment's
invoice, packing list and bill of lading; an AI model extracts fields with
confidence scores; the app cross-checks the three documents against each
other; a human confirms every low-confidence field and every failed check; a
manager approves; only then can the shipment be exported as CSV.

Two roles: **EXECUTIVE** (uploads, reviews, confirms) and **MANAGER**
(approves). Desktop only.

## 2. Architecture, and why

```
Next.js 16 (App Router, Server Components + Server Actions)
        │
        ├── Auth: signed JWT session cookie, no password (see §7)
        ├── Database: Postgres via Prisma 8 ("contract" ORM — see note below)
        ├── File storage: pluggable driver — local disk (dev) / Supabase
        │   Storage (prod), selected by STORAGE_DRIVER
        └── AI: Gemini (gemini-3.6-flash), called server-side only
```

**Why Next.js App Router, not a separate API + SPA**: the whole app is one
team's internal tool with no public API surface to speak of. Server
Components let every page read the database directly with no client-side
data-fetching layer, and Server Actions give every mutation (upload, confirm,
edit, approve, export) a single server-side entry point to put a role check
on — which is also hard rule #6 of the brief.

**Why Prisma, but not the Prisma you're picturing**: the installed version is
Prisma 8, which replaced the classic `schema.prisma` + `PrismaClient` API
entirely with a "contract" system (`src/prisma/contract.prisma` →
`prisma contract emit` → query via `db.orm.public.<Model>`). This wasn't a
choice made during this build — `package.json` already pinned
`prisma@^8.0.0-rc.30` before any of this was written. Worth knowing before
touching the schema: see `docs/DECISIONS.md`'s first entry, and the vendored
reference docs at `node_modules/@prisma/orm-postgres/skills/prisma-8/references/`.

**Why Gemini and not a bigger-name model**: cost. This is a from-scratch
build being tested without a production budget — Gemini's free tier is real
(verified live), at the cost of a ~5 requests/minute rate limit and an
unreviewed training-data policy on that tier (see §9, "no-training").

**Why a storage driver interface, not a direct Supabase Storage call
everywhere**: so the same `saveFile`/`readFile` calls in the extraction
service and upload action don't change when the deployment target changes.
`STORAGE_DRIVER=disk` (default) writes to `./uploads/` for local dev;
`STORAGE_DRIVER=supabase` switches to Supabase Storage with zero changes to
any calling code.

## 3. Data model

Eight tables. The ones worth explaining:

- **`Shipment`** — a reference, a status (`DRAFT → ... → EXPORTED`), and the
  three documents/checks/approvals attached to it.
- **`Document`** — one row per uploaded file (`INVOICE`/`PACKING_LIST`/
  `BILL_OF_LADING`, unique per shipment), tracking `extractionStatus`
  (`PENDING → PROCESSING → SUCCEEDED/FAILED`) and the file's storage path.
- **`ExtractedField`** — one row per field Gemini returned for a document:
  name, value, confidence, and a status (`AUTO`/`NEEDS_REVIEW`/`CONFIRMED`/
  `MANUAL`) that drives both the review screen's highlighting and the export
  gate.
- **`LineItem`** — invoice line items, same confidence/status shape as
  `ExtractedField` but a separate table (a line item isn't a single named
  field).
- **`CheckResult`** — one row per cross-check run, **append-only** (no
  unique constraint) — re-running checks after an edit writes a *new* row
  rather than overwriting the old one, so the history of how a check's
  outcome changed survives. The export gate and review screen both read only
  the *latest* row per check name.
- **`FieldEdit`** — the audit log hard rule #4 requires: who, when, old
  value, new value. Written by both confirming a field (old = new, logging
  *that someone looked at it*) and editing one.
- **`Approval`** — who approved a shipment and when. Manager-only.

Known schema gaps (see §8 "what was cut"): `LineItem` has no equivalent audit
trail (`FieldEdit`'s foreign key only points at `ExtractedField`); `CheckResult`
has no persisted `CANNOT_CHECK` state (it's currently just skipped, not
written); there's no export audit table.

## 4. Main flows

1. **Upload** → `uploadDocument` server action validates the file (MIME type
   allowlist, 10MB size cap) with Zod, saves it via the storage driver,
   upserts the `Document` row, then calls extraction *synchronously* before
   redirecting (see §8 on why this isn't async yet).
2. **Extraction** (`src/lib/extraction/extract.ts`) → reads the file, builds
   a Gemini request with a schema-constrained JSON response, validates the
   response with Zod, writes `ExtractedField`/`LineItem` rows, then re-runs
   every cross-check for the shipment.
3. **Cross-checks** (`src/lib/checks/`) → four pure functions (no DB, no I/O,
   unit-tested): invoice total vs. line-item sum, gross weight across
   invoice/packing-list, package count across all three documents, container
   number consistency across all three. `src/lib/run-checks-for-shipment.ts`
   is the thin, DB-touching layer that feeds them real data and persists the
   result.
4. **Review** (`/shipments/[id]/review`) → document on the left (served
   through an authenticated route, never a public URL), fields on the right.
   Confirming or editing a field writes `FieldEdit`; editing re-runs the
   checks immediately, so a correction can flip a failed check to passing
   without re-uploading anything.
5. **Approval** → a manager-only action that re-checks the other three gate
   conditions before allowing it (a manager can't approve a shipment that's
   still missing documents or has unresolved review items).
6. **Export** (`/shipments/[id]/export`) → the actual enforcement point.
   Re-checks all four gate conditions server-side — document count, no
   `NEEDS_REVIEW` fields, no unresolved failed checks, manager approval —
   and returns a 403 with the specific reasons if blocked. A disabled button
   in the UI is not the gate; this route is.

## 5. How the AI part works

**Model**: `gemini-3.6-flash` via `@google/genai`, called with the `v1beta`
API explicitly (the SDK's default `v1` rejects PDF input — found live, not
assumed).

**Prompt**: tells the model which field names to extract per document type,
to give each a value and a confidence from 0–1, and to omit a field rather
than guess if it isn't present.

**Output validation**: the response schema is generated from the same Zod
schema (`src/lib/extraction/schemas.ts`) used to validate the response —
`z.toJSONSchema()` builds the request-side schema, the same Zod object
`.parse()`s the response. Malformed JSON, a schema mismatch, an API error, or
an empty response are all caught in one place and recorded as `FAILED` on the
`Document` row with a human-readable error — never a crash (hard rule #3).

**Confidence → status**: a single constant,
`CONFIDENCE_THRESHOLD = 0.8` (`src/lib/extraction/extract.ts`) — at or above
is `AUTO`, below is `NEEDS_REVIEW`. **This is a placeholder, not a measured
number.** It was never validated against real extraction accuracy; it's the
one number in the whole confidence pipeline, not a calibrated heuristic with
multiple downgrade rules (format checks, cross-field conflicts) — a fuller
version of that heuristic was designed in a later planning pass (format-check
caps, conflict-detection caps) but never built. Treat every `AUTO` field as
"the model was confident," not as "verified."

**Failure paths**: API error/timeout/empty response → `Document.extractionStatus
= FAILED` with the error message stored, zero fields written. There is
currently **no manual-entry UI** for this case — a document that fails
extraction completely has nowhere for a human to type in the values by hand.
This is a real gap against the brief's own description of the flow ("...route
to manual entry") — see §8.

## 6. Key screens, and the reasoning behind them

- **Login** — no password. The brief asks for "two seeded users," not a full
  auth system; for a desktop-only internal tool with fake data, a
  click-to-sign-in list is the simplest thing that satisfies "two roles,
  role-checked everywhere" without building (and then having to explain)
  credential storage, password reset, or session-fixation handling for a
  demo that will never have a real password to protect. Swapping this for a
  real credentials form later doesn't touch `requireRole` or the session
  layer at all.
- **Shipment list** — a table plus a one-field "new shipment" form. No
  modal/dialog (despite a `Dialog` component existing in the design system)
  — a plain inline form was simpler and there was no reason provided to
  prefer a modal for a single text input.
- **Shipment detail** — three upload slots, one per document type, each
  showing extraction status once filled. This is also where the export gate
  and approval action live, since that's the natural "is this shipment done"
  summary view.
- **Review screen** — document viewer on the left, fields on the right,
  `NEEDS_REVIEW` fields visibly amber-highlighted (not just a status label
  — hard rule's own design brief: "uncertain fields obvious at a glance").
  One-click Confirm per field. A later, more detailed design (zoom/rotate on
  the image viewer, keyboard J/K navigation between uncertain fields,
  autosave with optimistic updates, a `sourceHint` caption tied to field
  focus, a history drawer) was specified in full but never built — see §8.
- **Design system** (`src/components/ui/`, demoed on `/dev/ui`) — one accent
  colour (indigo), a neutral slate scale, three semantic pairs (amber/red/
  green, each a soft background + a strong foreground, checked for AA
  contrast), native `<dialog>` for the Dialog component instead of a
  headless-UI dependency, light mode only (a calm all-day desktop tool has
  no stated need for a dark theme, and one mode halves the contrast-checking
  surface).

## 7. Labelled assumptions

Every assumption made during this build is logged, with its reasoning, in
`docs/DECISIONS.md` at the moment it was made (per the brief's own hard rule
#8). The headline ones:

- **No passwords** for the two seeded users (§6 above).
- **Export CSV shape**: one row per invoice line item, shipment-level fields
  (reference, container number, packages, gross weight) repeated per row —
  not specified in the brief.
- **Upload limits**: 10MB max, PDF/PNG/JPEG only — proposed defaults.
- **Confidence threshold**: 0.8 — proposed, unvalidated (§5).
- **Cross-check tolerances**: gross-weight comparison tolerance and
  invoice-total tolerance are both function *parameters*, not hardcoded, so
  the real numbers can be set without touching the pure check functions —
  but the actual values shipped are placeholders.
- **Approval requires the other three gate conditions already met** — a
  manager can't approve a shipment that still has open review items.
- **Gemini over a paid provider** — a deliberate cost decision, with real
  consequences for rate limits and training-data policy (§9).

## 8. What was cut

In priority order — what I'd fix first if this kept going:

1. **Manual entry for failed/unreadable extractions.** Right now a document
   that fails extraction entirely has zero fields and no way for a human to
   add them. This is the single biggest functional gap against the brief's
   own described flow.
2. **`LineItem` has no audit trail.** `FieldEdit`'s foreign key only points
   at `ExtractedField`. A line item can be confirmed but not edited, and
   even confirming it writes nothing to the edit log. Needs a schema change
   (a nullable `lineItemId` on `FieldEdit`, or a parallel table) that was
   planned but never approved/built.
3. **No override mechanism for a failed check.** The current "mark
   resolved" action just sets a timestamp — no required note, no audit
   trail. A real audit process would want a mandatory, logged reason for
   overriding rather than fixing the underlying data.
4. **`CheckResult` doesn't persist `CANNOT_CHECK`.** A shipment missing
   documents has every relevant check silently skipped, not recorded — so
   there's no stored evidence the system ever tried. (It still correctly
   blocks export — see `evaluateExportGate`'s tests — this is about
   auditability, not correctness of the gate itself.)
5. **No export audit log.** Exporting flips `Shipment.status` to `EXPORTED`
   with no record of who did it, when, or how many times.
6. **The fuller review screen** — zoom/rotate image viewer, keyboard
   navigation (J/K between uncertain fields, Enter to confirm-and-advance),
   autosave with optimistic updates and rollback, a `sourceHint` caption
   that follows field focus, a collapsible cross-check panel, a history
   drawer. Designed down to the exact layout; not built.
7. **Upload validation trusts the browser's declared MIME type**, not the
   file's actual magic bytes. A renamed `.exe` with a spoofed
   `Content-Type: application/pdf` header currently passes.
8. **No background job queue for extraction.** Uploads call Gemini
   synchronously and the request blocks until it responds (several seconds).
   Fine at the volume this brief describes; wouldn't scale past it.
9. **No `loading.tsx` skeleton on any auth-gated screen**, despite being
   asked for. Adding one was tried and reverted — it broke the HTTP-level
   auth redirect under this Next.js version's Cache Components (verified:
   `curl` got a `200` instead of `307` with a `loading.tsx` present). Full
   explanation in `docs/DECISIONS.md`.

## 9. What I'd do next

In order:

1. Build manual entry (§8.1) — it's the biggest hole relative to what the
   brief actually describes.
2. Fix the `LineItem` audit gap and build the override-with-note mechanism
   (§8.2, §8.3) together, since both need the same kind of schema change.
3. Replace the placeholder confidence threshold and cross-check tolerances
   with real, measured numbers — this needs the broker's actual input, not
   more engineering.
4. Move extraction off the request path (§8.8) once upload volume justifies
   it — a queue (even a simple Postgres-backed one) rather than a new
   infrastructure dependency.
5. Magic-byte file validation (§8.7) — a small, contained fix.
6. The fuller review screen (§8.6) — highest effort, lowest urgency; the
   current screen is functional, just not as fast to use.
7. Re-evaluate the AI provider once there's a real budget — a paid tier with
   a contractual no-training guarantee, not Gemini's free tier (§9 below).

## 10. India hosting, no-training, and DPDP — what production would need, and what this demo does not satisfy

**State plainly first**: this demo satisfies **none** of these three
properties today. It was built to demonstrate the workflow with fake data on
a zero-budget stack, not to handle real shipment documents. Below is what's
actually true now, and what would need to change.

### India data residency
Not satisfied. The current dev database is on Supabase's default region
(not India); Vercel's serverless function execution region would similarly
need to be pinned explicitly. Both Supabase and Vercel offer a Mumbai region
option, but I have not verified current availability/pricing for either as
part of this build — that needs checking against their live documentation
at deploy time, not assumed from training knowledge (several things in this
project have already turned out to differ from what I expected going in).
What production would need: explicitly provision the Postgres database and
the storage bucket in an India region, and pin the Vercel deployment's
function region to Mumbai (`bom1`) rather than the default.

### No-training on submitted data
**Not satisfied, and this is the sharpest gap.** Gemini's free tier — which
this demo deliberately uses for cost reasons (see `docs/DECISIONS.md`) — may
use submitted content to improve Google's models. Real shipment documents
(invoices, packing lists, bills of lading) contain business and personal
data (shipper/consignee names and addresses, for instance) that should never
be sent to a model whose terms allow training on it. Production would need
either a paid Gemini/Vertex AI tier with an explicit no-training clause in
its terms, or a different provider entirely with the same guarantee in
writing — not just a settings toggle, a contractual term to verify before
sending real data.

### DPDP Act, 2023 compliance
Not satisfied — no part of this build addresses DPDP's procedural
requirements, because none were in scope for a fake-data demo. Concretely
missing: no consent capture or privacy notice for the data principals whose
information appears in uploaded documents (shippers, consignees — people who
never agreed to this app processing their data); no mechanism for a data
principal to request access to, correction of, or erasure of their data; no
data retention or deletion policy (uploaded documents and extracted fields
are kept indefinitely); no breach notification process; no grievance officer
or consent manager integration. None of this is a coding task that can be
"added" quickly — it's a set of organizational and legal obligations (data
processing agreements with Google/Supabase/Vercel, a retention policy, a
consent flow at the point documents are collected from shippers/consignees
upstream of this app) that need to exist before this handles real data, not
after.
