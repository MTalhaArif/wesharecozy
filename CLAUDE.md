# WeShareCozy

Home-sharing and subrental marketplace for Istanbul. Classifieds model:
users post listings, seekers browse and search, they connect via in-app
messaging (not yet built). No payments, no booking calendar in v1.

## Stack

Next.js 15 App Router · TypeScript strict · Tailwind v4 · shadcn/ui (Base UI
primitives, not Radix) · **Firestore + Firebase Auth + Firebase Storage** ·
next-intl · Leaflet + OpenStreetMap · Zod · react-hook-form · Vitest ·
Playwright · pnpm · deploys to Vercel

There is no Prisma, no PostgreSQL, no Auth.js/NextAuth in this project —
Firebase is the entire backend. Server Actions call the Firebase Admin SDK
directly.

## Commands

- `pnpm dev` — dev server
- `pnpm typecheck` — tsc --noEmit (MUST pass before you say a task is done)
- `pnpm lint` — eslint
- `pnpm build` — production build
- `pnpm test` — vitest run
- `pnpm test:e2e` — playwright (run via `firebase emulators:exec "pnpm test:e2e"`)
- `pnpm emulators` — starts Firestore/Auth/Storage emulators (requires a Java
  runtime; not available in every dev environment — check `java -version`)
- `pnpm seed:districts` — seeds the Istanbul district reference data into
  whichever Firestore the Admin SDK is currently pointed at (emulator by
  default in dev)

## Required environment variables

Never write to `.env*` files (see Working style below) — create these
yourself in `.env.local`, which is gitignored.

Client (exposed to the browser, `NEXT_PUBLIC_` prefix required):
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` (`"true"`
in dev to route the client SDK at the local emulators).

Server-only:
`FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_SERVICE_ACCOUNT_KEY`
(a JSON service-account key string — production only; omit it in dev and the
Admin SDK talks to the emulators via `FIRESTORE_EMULATOR_HOST` /
`FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_STORAGE_EMULATOR_HOST`, which
`firebase emulators:start` sets automatically for anything it spawns).

With no `.env.local` at all, the app still boots against a `demo-wesharecozy`
placeholder project ID — fine for `pnpm typecheck` / `pnpm build`, not for
actually exercising Firebase-backed pages.

## Conventions

- Server Components by default. `"use client"` only when you need state,
  effects, or browser APIs (Firebase Auth client SDK, Leaflet, file inputs,
  Canvas). Justify it in a one-line comment when you add it.
- All data mutations go through Server Actions in `src/actions/`, never
  through route handlers, unless a third party needs a webhook.
- Every Server Action, in this order: (1) **authenticate** — verify the
  caller's Firebase ID token via `adminAuth.verifyIdToken()`, (2)
  **authorize** — check the caller against the specific resource (ownership,
  phone-verified gates, etc.), (3) **parse** input with a Zod schema, (4)
  **act**. In practice, a Server Action's *only* argument from the client is
  an untrusted blob (`FormData` or a plain object) containing an `idToken`
  plus form fields — Zod is used first just to safely extract a typed
  `idToken` string before anything is trusted; nothing else from that input
  is used until the token is verified. See
  `src/actions/listings/create-listing.ts` for the fullest example.
- Zod schemas live in `src/lib/schemas/` and are shared client+server (used
  as both the `react-hook-form` resolver and the Server Action's validator).
- `src/lib/firebase-admin.ts` and `src/lib/firebase-client.ts` are the only
  places the Admin SDK / client SDK are initialized — both are singletons
  guarded against re-init on Next.js dev-mode HMR. Never call
  `initializeApp()` anywhere else.
- Firestore collection/doc naming: `camelCase` field names, plural collection
  names (`listings`, `districts`, `users`). Money fields are integers in
  kuruş (TRY minor units), never floats, and end in `Kurus` (e.g.
  `rentKurus`). Dates are Firestore `Timestamp`s (UTC), rendered in
  Europe/Istanbul.
- **Public/private doc-split pattern**: any Firestore document with a mix of
  public and sensitive fields is split into a public top-level doc plus a
  `private` subcollection doc (e.g. `users/{uid}` + `users/{uid}/private/contact`,
  `listings/{id}` + `listings/{id}/private/location`). The public doc
  physically never contains the sensitive fields, so there's no field-level
  redaction to get wrong. Reuse this pattern for any new sensitive field
  rather than inventing a new mechanism.
- **Security rules philosophy** (`firestore.rules`, `storage.rules`):
  deny-by-default. Nearly every rule is `allow write: if false` because all
  mutations route through Server Actions using the Admin SDK, which bypasses
  rules entirely by design — the rules are a defense-in-depth backstop, not
  the primary authorization mechanism. Authorization lives in
  `src/actions/`. When you add a new collection, add its rule in the same
  change.
- Listing expiry (30 days after publication) is **computed on read**, not a
  stored/cron-swept status — see `src/lib/listings/is-expired.ts`. A
  published-but-expired listing still has `status: "PUBLISHED"` in Firestore
  until reactivated or a future batch-cleanup job runs; every read path that
  shows listings must apply `isListingExpired()`.
- Leaflet (`react-leaflet`) touches `window`/`document` at import time and
  will crash under SSR. Any component using it must be dynamic-imported with
  `{ ssr: false }` — and since that option is only legal inside a Client
  Component, wrap it in a thin `"use client"` loader (see
  `listing-map-loader.tsx`) when the consumer is a Server Component.
- This project's shadcn/ui is generated on **Base UI**, not Radix. Base UI's
  `Select` `onValueChange` can emit `null` (deselection) where Radix never
  would — always guard (`if (value) setValue(...)`) rather than
  type-asserting past it.
- EXIF stripping (photos, GPS tags especially) happens **client-side** via a
  `<canvas>` re-encode (`src/lib/images/strip-exif.ts`) before upload — a
  canvas only ever holds decoded pixels, never source metadata. No
  server-side image library (e.g. `sharp`) is in the dependency graph for
  this; don't add one without discussing it first.
- OTP phone verification is a **stub**: `src/lib/otp/send-otp.ts` logs the
  code to the console instead of sending real SMS. `requestOtp` also returns
  the code directly outside `NODE_ENV=production` so the UI/e2e tests don't
  need to scrape logs — this must never leak in production. Swapping in a
  real provider (Twilio, Netgsm, İleti Merkezi) only touches `send-otp.ts`.
- File naming: kebab-case files, PascalCase components.
- Package manager: pnpm only.

## Domain rules

- Every listing must belong to a valid Istanbul district (seeded via
  `pnpm seed:districts`, see `src/lib/districts/district-data.ts`). Reject
  anything else.
- Listing types: `ROOM_IN_SHARED_FLAT`, `WHOLE_FLAT_SUBLET`,
  `SHORT_TERM_SUBLET`, `FLATMATE_WANTED`.
- Listings expire 30 days after publication and need re-activation (see
  "computed on read" above).
- Users must verify a phone number (`users/{uid}.phoneVerified`) before
  publishing — enforced **server-side** in `create-listing.ts`, independent
  of whatever the client form currently shows.
- Exact addresses are never public. Show neighborhood + an offset map pin
  (±300m jitter, `src/lib/geo/jitter.ts`). Exact coordinates live only in
  `listings/{id}/private/location`, which no client can read directly —
  revealing them is reserved for a future Server Action gated on an existing
  message thread between the parties (messaging is not yet built).
- Max 15 photos per listing, 5MB each, stripped of EXIF (GPS especially).

## Legal / compliance (Turkey)

- KVKK applies. Personal data is minimized; no data leaves the EU/TR region
  without a documented basis. Every data-collecting form (signup, listing
  creation) has an explicit, unticked consent checkbox, and every acceptance
  is recorded as a doc in `users/{uid}/consents/{consentId}` with a
  `consentTextVersion` so historical wording stays auditable.
- Do not implement anything that facilitates discriminatory filtering on
  ethnicity, religion, or nationality. Gender preference for shared-flat /
  flatmate listings is permitted (standard for flatmate matching) and is the
  only protected-characteristic filter allowed —
  `genderPreference`/`genderForFiltering` in the schemas.
- Phone numbers and emails are never rendered on public pages — they live
  only in `users/{uid}/private/contact`, which `get-listing.ts` and friends
  never read.

## What's built vs. not yet

Built (the v1 vertical slice): signup with KVKK consent, stub phone OTP
verification, listing creation (district-scoped, address jitter, EXIF-safe
photo upload, consent), listing detail page, district-scoped search page,
unit tests, and an e2e spec for the full flow.

Explicitly not yet built: messaging (schema modeled, no UI/actions), full
search filters (price/room-count/gender-preference UI), listing
edit/deactivate/reactivate, admin/moderation tooling, a real SMS provider,
Cloud Functions batch-cleanup for expired listings, and production Firebase
project / Vercel deployment wiring.

## Working style

- Before implementing anything non-trivial, present a plan and wait for my OK.
- Make small, focused commits with conventional-commit messages.
- After each task run `pnpm typecheck` and `pnpm lint` and fix what breaks.
- If a requirement is ambiguous, ask. Do not guess and build the wrong thing.
- Do not add dependencies without asking first.
- Never write to `.env*` files.