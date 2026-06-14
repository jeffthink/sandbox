# Multi-Family Swim Tracker — Design

**Date:** 2026-06-14
**Status:** Approved (pending spec review)

## Goal

Extend the swim tracker so it can host a **living dashboard for a second family** (and beyond) as a gift — distinct per-family URL, isolated data and password — while every family shares one codebase (`SwimDashboard`, the password gate, the API endpoint). Adding a family becomes "set some env vars," not "copy a folder."

> **Privacy note for this document:** All family identifiers below are fictional placeholders (`riverside`). No real family name appears in this repo — not in code, tests, `.env.example`, or this spec.

## Background / Current State

Today the tracker is single-family:

- `/swim-tracker` — public demo, synthetic data, no gate.
- `/swim-tracker/family` — static route, password-gated, renders real data.
- `/api/swim-data/+server.js` — serverless `POST`; verifies a single `SWIM_PASSWORD`, then loads three Google-Sheet CSVs from `MEETS_CSV_URL` / `RACES_CSV_URL` / `SWIMMERS_CSV_URL`.
- `src/lib/server/swimGate.js` — primitives: `verifyPassword(submitted, expected)` (constant-time) and `loadSwimData({ meetsUrl, racesUrl, swimmersUrl, fetch })`.
- The family page stores the unlock password in `sessionStorage` under the shared key `swim-family-pw`.

All secrets live in server-side env vars and are never shipped to the browser. The page is `noindex`.

## Why not a database (decision record)

We considered moving from Google Sheets to a database (SQLite/Turso or Supabase) and chose **to stay on Sheets + env vars** for now:

- The real bottleneck is **data entry** (parsing meet PDFs), already solved by the `swim-results-import` skill. A database does not make that easier.
- Google Sheets is a free, human-editable, shareable store that the serverless function already fetches. Going 1 → 2 families (or a handful) does not justify new infrastructure.
- File-based SQLite does **not** fit Vercel's ephemeral serverless filesystem; "SQLite on Vercel" really means a hosted service (Turso/libSQL).
- Supabase is the right choice *if/when* we outgrow Sheets, because of real per-person auth — but that is a product-shaped step heavier than this gift warrants.

**The enabling move is a clean data-source seam** (below), so a single family can later migrate to Supabase as a localized change. **Triggers to revisit:** wanting families to self-enter times via a form; crossing ~5–10 families; or wanting per-person login instead of a shared family password.

## Architecture

Dependency direction: **route → API → `families.js` (seam) → `swimGate.js` (Sheets today / Supabase later)**. Each layer has one job and a clean interface.

```
src/lib/server/
  swimGate.js      (existing — low-level primitives, unchanged)
  families.js      (NEW — registry + data-source seam)

src/routes/swim-tracker/
  +page.svelte             (existing public demo — unchanged)
  [family]/+page.svelte    (NEW dynamic gated page — replaces family/)
  family/+page.svelte      (REMOVED — replaced by a redirect)
```

### `families.js` — registry + seam

No hardcoded list of families. The valid set is **derived from the environment at runtime**, so no family identifier ever appears in the repo.

1. **Slug discovery** — scan `$env/dynamic/private` for keys matching `SWIM_<SLUG>_PASSWORD`. The discovered `<SLUG>` (lowercased) is a valid family. The slug exists only in (a) the Vercel env var name and (b) the URL shared privately with the family.

2. **`getFamilyConfig(slug)`** — for a valid slug, read its prefixed env vars and return
   `{ password, meetsUrl, racesUrl, swimmersUrl }`; return `null` for any slug not discovered.
   Env var convention per family:
   - `SWIM_<SLUG>_PASSWORD`
   - `SWIM_<SLUG>_MEETS_URL`
   - `SWIM_<SLUG>_RACES_URL`
   - `SWIM_<SLUG>_SWIMMERS_URL`

3. **The seam** — the only two functions the API calls:
   - `verifyFamilyPassword(slug, submitted)` → `boolean`. Returns `false` for an unknown slug **or** a wrong password (indistinguishable). Wraps `swimGate.verifyPassword`.
   - `loadFamilyData(slug, fetch)` → `{ meets, races, swimmers }`. Wraps `swimGate.loadSwimData`.

   This is the swappable layer: migrating one family to Supabase changes **only** these two functions for that slug; the route, API contract, and `SwimDashboard` are untouched.

### Slug rules

- Slugs are **friendly names** (e.g. `riverside`) for a warm, memorable gift URL.
- Allowed characters: `[a-z0-9]+`, length-bounded (e.g. 2–32). Restricting to lowercase alphanumerics keeps a clean, unambiguous mapping to the uppercase env prefix (no underscore collisions).
- The slug is visible only in the privately shared URL — never in the repo. `noindex` keeps it out of search engines.

## Route & Page

`src/routes/swim-tracker/[family]/+page.svelte`, refactored from the current `family/+page.svelte`:

- Same password gate + `SwimDashboard`, now parameterized by `$page.params.family`.
- POSTs `{ family, password }` to `/api/swim-data`.
- **Namespaced session key**: `swim-family-pw:<family>` (instead of the shared `swim-family-pw`), so two families unlocked in the same browser do not clobber each other.
- Generic error copy on 401 ("Incorrect password") — never reveals whether a family exists.
- `noindex` meta retained.

**Routing note:** the static `family/` folder is removed so it cannot shadow the dynamic `[family]` route. A redirect from `/swim-tracker/family` → the owner's new slug preserves existing bookmarks. The public demo at `/swim-tracker` is unchanged.

## API Contract

`src/routes/api/swim-data/+server.js`:

- Request body gains exactly one field: `{ family, password }`. Response shape is unchanged, so `SwimDashboard` needs **no** changes.
- Validate slug shape (`[a-z0-9]+`, length-bounded). **Bad slug format, unknown family, and wrong password all return an identical generic 401** — no enumeration.
- On success: `verifyFamilyPassword(family, password)` → `loadFamilyData(family, fetch)` → `json(data)`.
- Generic 500 on fetch failure retained (never leak CSV URLs).

## Privacy Guarantees (summary)

- No family name in the repo: code, tests, `.env.example`, and this spec use the fictional `riverside`.
- The only places a real slug exists are the Vercel dashboard and the privately shared link.
- No enumeration: unknown slug ≡ wrong password (identical 401). The password gate still protects all data even if a URL is guessed.
- `noindex` on the gated page.

## Migration (owner's own family)

Single-family env vars (`SWIM_PASSWORD`, `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL`) become prefixed under the owner's chosen slug. Safe ordering so the live site never breaks:

1. Add new `SWIM_<OWN>_*` vars in Vercel pointing at the **same** Sheets (old vars still present).
2. Deploy the new code.
3. Verify `/swim-tracker/<own>` and the `/swim-tracker/family` redirect both work.
4. Delete the old unprefixed vars.

## "Gift a Family" Runbook

1. Copy the Google Sheet template → their 3 tabs (Meets / Races / Swimmers).
2. Publish each tab as CSV; capture the 3 URLs.
3. Set 4 Vercel env vars: `SWIM_<SLUG>_PASSWORD`, `_MEETS_URL`, `_RACES_URL`, `_SWIMMERS_URL`.
4. Load their meet results into the Sheet.
5. Share `/swim-tracker/<slug>` + the password privately.

## Testing

- **New `families.test.js`** (fictional slugs only):
  - slug discovery from a mocked env;
  - `getFamilyConfig` returns `null` for an unknown slug and a populated config for a known one;
  - `verifyFamilyPassword` returns `false` for an unknown family and for a wrong password, `true` for a correct one;
  - slug-format validation (rejects uppercase, punctuation, over-length).
- **`swimGate.test.js`** — unchanged (primitives untouched).
- **API-level test** — unknown-family and wrong-password requests return an identical generic 401 (the no-enumeration guarantee).

## Out of Scope (YAGNI)

- Any database, per-person login, self-serve data entry, or write UI.
- **Native multi-family support in the `swim-results-import` skill** — a separate follow-up spec. Day one, the second Sheet is maintained by hand or by swapping a gitignored per-family `config.<slug>.local.md`; nothing blocks the gift.
- The data-source seam keeps all of the above as clean future swaps.
