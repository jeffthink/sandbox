# Shared Family Gate (type-your-own-family unlock) — Design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)
**Branch:** feat/multi-family-swim-tracker

## Goal

Let a visitor unlock a family's private swim results by **typing the family name (slug) and password in one form**, reachable from the lock icon on the demo page. Arriving directly at `/swim-tracker/<slug>` shows the **same form with the family pre-filled**. The form must be **centered** (today it is left-aligned).

> Privacy note: this repo is public. All examples here use the fictional placeholder `riverside`. No real family name appears in code, tests, or this spec.

## Background / Current State

- `/swim-tracker` — public demo. A lock icon (top-right of the card) links to `/swim-tracker/family`.
- `/swim-tracker/[family]/+page.svelte` — password gate for a slug taken from the URL; on unlock renders `SwimDashboard`. Contains the auth fetch + per-family session/reset logic inline.
- `/swim-tracker/family/` — currently a **308 redirect** to `OWNER_SLUG` (`+page.server.js`) with a placeholder `+page.svelte`.
- `/api/swim-data` — POST `{ family, password }` → uniform 401 on any auth failure; returns `{ meets, races, swimmers }`.
- The gate form is `max-width: 320px` with no auto-margin, so inside the centered `.widget-container` card it sits left-aligned.

## Decisions (from brainstorming)

1. **Generic gate location:** repurpose `/swim-tracker/family` as the generic gate (replacing the redirect). `OWNER_SLUG`, when set, pre-fills the family field; otherwise the field is empty.
2. **URL on unlock:** after a successful unlock where the slug was typed (not already in the URL), update the address bar to `/swim-tracker/<slug>` so refresh stays on that family and the URL is shareable.
3. **Pre-filled family field is editable** (it is "the same form").

## Architecture

Extract the gate into a shared component so one form serves both entry points; the two routes become thin wrappers.

```
src/lib/components/swim-tracker/
  FamilyGate.svelte   (NEW — form + auth + dashboard-on-success)
  SwimDashboard.svelte (unchanged)

src/routes/swim-tracker/
  +page.svelte                 (demo — lock already points at /swim-tracker/family; no change)
  [family]/+page.svelte        (MODIFY — render <FamilyGate initialFamily={slug} />)
  [family]/+page.js            (unchanged — prerender = false)
  family/+page.server.js       (MODIFY — drop redirect; load returns { ownerSlug })
  family/+page.svelte          (MODIFY — render <FamilyGate initialFamily={data.ownerSlug} />)
```

`families.js` and `/api/swim-data` are **unchanged**.

### `FamilyGate.svelte`

**Prop:** `initialFamily = ''` (string).

**State:** `family` (init from `initialFamily`), `password`, `unlocked`, `loading`, `error`, `meets`, `races`, `swimmerEmojis`.

**Behavior:**
- Renders, when locked, a centered form: **Family** text input (bound to `family`, pre-filled, editable; `autocapitalize="none"`, `autocomplete="off"`, `spellcheck="false"`), **Password** input, Unlock button (disabled while loading or when either field is empty), and an error line. When unlocked, renders `<SwimDashboard {meets} {races} {swimmerEmojis} />`.
- **Submit:** compute `slug = family.trim().toLowerCase()`; if `slug` or `password` empty, do nothing. POST `{ family: slug, password }` to `/api/swim-data`.
  - `401` → error "Incorrect family or password. Please try again." (uniform; no enumeration).
  - other non-ok → "Could not load swim data. Please try again later."
  - success → set `meets`/`races`/`swimmerEmojis` (emojis built from `data.swimmers` filtering `s.Name && s.Emoji`), `unlocked = true`, `sessionStorage.setItem(\`swim-family-pw:${slug}\`, password)`. On failure, `sessionStorage.removeItem(\`swim-family-pw:${slug}\`)`.
- **URL reflection:** on success, if `$page.url.pathname !== \`/swim-tracker/${slug}\``, call `replaceState(\`/swim-tracker/${slug}\`, {})` from `$app/navigation` (shallow routing — no remount, no refetch).
- **Per-family reset + auto-unlock:** a `browser`-guarded reactive block keyed on `initialFamily`. When `initialFamily` changes: reset `unlocked`/data/`error`, set `family = initialFamily`, and if `initialFamily` is non-empty, read `sessionStorage[\`swim-family-pw:${initialFamily}\`]`; if present, auto-submit it. (`browser` guard because `sessionStorage` is unavailable during SSR.)

**Centering:** the form box gets `margin: 0 auto` (keeping `max-width: 320px`); inner labels/inputs remain left-aligned via `text-align: left` on the form. Existing label/input/button/error styles carry over from the current gate.

### Routes

- **`[family]/+page.svelte`:** keep `<svelte:head>` (`<title>`, `noindex`), the `.container`/`.header` wrapper and `<h1>`/intro `<p>`. Replace the inline gate logic with `<FamilyGate initialFamily={$page.params.family} />`. `+page.js` stays (`prerender = false`).
- **`family/+page.server.js`:** remove the `redirect`. Add:
  ```js
  import { env } from '$env/dynamic/private';
  export const prerender = false;
  export function load() {
    return { ownerSlug: env.OWNER_SLUG ?? '' };
  }
  ```
- **`family/+page.svelte`:** mirror the `[family]` page's wrapper/heading and render `<FamilyGate initialFamily={data.ownerSlug} />` (`export let data;`). Keep `noindex`.

## Data Flow

1. Lock icon → `/swim-tracker/family`. Server `load` provides `ownerSlug`. `FamilyGate` pre-fills `family` with it (or empty).
2. User edits/types family + password → submit → POST `/api/swim-data`.
3. On success: dashboard renders in place; `replaceState` updates the URL to `/swim-tracker/<slug>`; password saved to the per-slug session key.
4. Direct visit to `/swim-tracker/<slug>`: `[family]` route passes the slug as `initialFamily`; the reactive block auto-unlocks from the saved session password if present, else shows the pre-filled gate.

## Error Handling

- Uniform 401 from the API surfaces as "Incorrect family or password" — does not distinguish unknown family, misconfigured family, or wrong password (no enumeration).
- Network/other errors surface as a generic load-failure message.
- Empty family or password disables submit.

## Testing / Verification

- `families.js` and the API are unchanged, so the existing 41 unit tests still cover the backend; run `npm test` to confirm no regression.
- No Svelte component test harness exists in this repo; verify this UI work via `npm run build` (clean, no prerender error) plus a dev-server walk:
  - Lock → generic gate appears **centered**; empty when `OWNER_SLUG` unset, pre-filled when set.
  - Type `riverside` + correct password → unlocks; address bar becomes `/swim-tracker/riverside`; refresh stays unlocked.
  - Wrong family or password → "Incorrect family or password".
  - Direct `/swim-tracker/riverside` → pre-filled, centered gate; auto-unlocks if session password present.

## Out of Scope (YAGNI)

- No change to `families.js`, `/api/swim-data`, or the env scheme.
- No friendly-name→slug mapping beyond `trim().toLowerCase()`.
- No "remember me" beyond the existing per-tab `sessionStorage`.
- The legacy `/swim-tracker/family` → `OWNER_SLUG` redirect is intentionally removed; `OWNER_SLUG` now serves as the generic gate's pre-fill.
