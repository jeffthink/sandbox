# Swim Tracker Privacy — Design

**Date:** 2026-06-13
**Status:** Approved (pending spec review)

## Problem

The swim tracker is a fully static SvelteKit site (`adapter-static`, deployed to
Vercel). Swim data is fetched **client-side** from **published Google Sheets CSV
URLs**, which Vite inlines into the browser bundle at build time. As a result:

- The CSV URL and the raw data both pass through the visitor's browser and are
  visible in the Network tab and the JS bundle.
- The "Publish to web" CSV URL has **no authentication** — anyone with the URL
  can read every name, time, and meet directly, bypassing the app entirely.

A front-end-only password cannot fix this; the data is a publicly-published file,
not something hidden behind the app. We need real, server-side gating for the
kids' results, plus a public synthetic demo so others can see how the tool works
without exposing the family's data.

## Goals

1. **Genuinely gate** the real results so the Google CSV URL never reaches the
   browser and data is only returned after a correct password (server-side check).
2. **Public synthetic demo** with clearly fictional data, bundled in the repo, so
   reviewers and visitors can explore the tool without any real kid data.

## Non-Goals (YAGNI)

- De-identifying real names (the gate protects them).
- User accounts, login/logout UI, or roles.
- Rate-limiting beyond an optional failed-attempt delay. Assumption: the family
  uses a strong passphrase, not a short PIN.
- An httpOnly signed-cookie session (noted as a future upgrade path only).

## Architecture

Two surfaces share the **same components and data-processing**; only the data
*source* differs.

| Route | Audience | Data source | Password? | Rendering |
|---|---|---|---|---|
| `/swim-tracker` | Public / reviewers | Bundled synthetic file | No | Prerendered/static |
| `/swim-tracker/family` | The family | Serverless `POST /api/swim-data` | Yes | Client-rendered |

Reused without change: `SummerSummary`, `RacesTable`, `TimeProgressChart`,
`MeetPerformanceChart`, and `processSwimData(meets, races)`.

### Adapter change

- Replace `@sveltejs/adapter-static` with **`@sveltejs/adapter-vercel`**.
- All existing pages remain prerendered/static (the global
  `prerender = true` in `src/routes/+layout.js` stays). The adapter swap only
  *adds* the ability to run one server endpoint.
- The API route opts out of prerendering with `export const prerender = false`.

### The serverless gate

New endpoint: **`POST /api/swim-data`** (`src/routes/api/swim-data/+server.js`).

Request body: `{ "password": "<string>" }`

Behavior:
1. Read server-side env vars (no `VITE_` prefix, so never shipped to the client):
   `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, `SWIM_PASSWORD`.
2. Compare the submitted password against `SWIM_PASSWORD` using a constant-time
   comparison.
3. On mismatch → `401`. (Optional small fixed delay on failure to blunt brute force.)
4. On match → fetch the three CSVs **server-side**, parse them (reuse the existing
   pure-JS `parseCSV` logic from `googleSheetsCSV.js`, shared server-side), and
   return JSON `{ meets, races, swimmers }`.

The Google CSV URL is held only on the server and never returned to the browser.
This is what closes the DevTools / raw-URL exposure.

### Family page session behavior

`/swim-tracker/family`:
- Renders a password input.
- On submit, POSTs to `/api/swim-data`. On `200`, processes and renders the data;
  on `401`, shows an error and lets the user retry.
- On success, caches the password in **`sessionStorage`** so a page refresh
  re-submits automatically without re-prompting. Cleared when the tab closes.
- Rationale: proportionate for a family tool served over HTTPS; the realistic
  adversary is a random internet visitor, not someone with the parent's unlocked
  browser. Upgrade path (out of scope): an httpOnly signed-cookie session so the
  password never lives in JS.

### Synthetic demo data

New file: **`src/lib/data/demoSwimData.js`**, exporting `meets`, `races`, and
`swimmers` arrays in the **exact shape produced by the CSV parser** (arrays of row
objects with the same column keys), so `processSwimData()` runs identically and
reviewers see the expected data format.

Content: clearly fictional swimmers (e.g. "Marlin Waters", "Pip Splash"), a
realistic summer season of meets, standard events (50 Free, 100 Back, etc.), and
times that show believable progression and personal records so every tab and chart
renders with meaningful data.

`/swim-tracker` imports this file directly at build time (no network fetch), keeping
it fully static.

## Data flow

**Demo (`/swim-tracker`):**
`demoSwimData.js` → `processSwimData(meets, races)` → components. No network, no password.

**Family (`/swim-tracker/family`):**
password input → `POST /api/swim-data` → (server: validate password, fetch + parse
CSVs) → JSON `{ meets, races, swimmers }` → `processSwimData()` → components.

## Error handling

- Wrong password → `401` from the API; the family page shows an inline error and
  allows retry.
- CSV fetch/parse failure server-side → `500` with a generic message (no internal
  detail leaked); the family page surfaces a friendly "couldn't load data" error.
- Demo page has no failure path beyond normal component rendering (data is local).

## Housekeeping / wiring

- Home page `/` keeps its `/swim-tracker` link (now the demo). Add a discreet
  **🔒 Family results** link to `/swim-tracker/family`.
- Remove the `VITE_*` swim CSV URLs from `.env` (the public page no longer touches
  Google); add the non-`VITE_` server vars and `SWIM_PASSWORD`.
- Update `.env.example` and `README.md` for the new env vars and the demo/gated split.
- Set `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`, `SWIM_PASSWORD` in
  **Vercel project settings** (server env, not exposed to the client).

## Security notes

- This design prevents the real CSV URL and data from reaching unauthenticated
  visitors. It does **not** retroactively unpublish data already crawled/cached
  while the sheet was public — rotating the sheet (fresh URL or new sheet) is
  recommended alongside this change if the data has been public for a while.
- Use a strong passphrase for `SWIM_PASSWORD`, not a short numeric PIN.

## Testing

- `npm run dev`: demo at `/swim-tracker` renders all four tabs from bundled data
  with no password and no network calls to Google.
- `/swim-tracker/family`: wrong password is rejected; correct password loads and
  renders real data; the Network tab shows requests only to `/api/swim-data`,
  never to `docs.google.com`.
- Confirm the built client bundle contains no Google CSV URL (grep the build output).
- `npm run build && npm run preview`: prerendered pages still build; the API route
  runs as a function.
- Verify desktop + mobile rendering and iframe embedding are unaffected.
