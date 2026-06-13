# Swim Tracker — Season Filter Design

**Date:** 2026-06-13
**Status:** Approved (pending implementation plan)

## Goal

Introduce a "Season" concept to the swim tracker. Add a single, shared,
multi-select **Season** filter to the dashboard that applies to all four views
at once. A season is a calendar year, derived from each meet's date — no data
schema change. The filter defaults to the current calendar year, falling back to
the most recent year that has data when the current year is empty.

## Decisions

- **Season = calendar year**, derived from `meet.Date` (`getFullYear()`). No new
  field in the meets/races data.
- **Default selection:** the current calendar year if it has races; otherwise the
  most recent year that has data (fall-back-to-latest). Never load empty when any
  data exists.
- **Placement:** one shared multi-select above the tab nav in `SwimDashboard`,
  applying to all four views simultaneously.
- **Label:** year only (e.g. `2025`).
- **Scope of stats:** stats (PRs, improvements, highlights) are season-scoped —
  they reflect only the selected seasons, achieved by re-running
  `processSwimData()` on the season-filtered subset.

## Architecture

Centralize processing in the dashboard. `processSwimData()` moves out of the two
page routes and into `SwimDashboard`. The dashboard receives raw `meets` +
`races`, owns `selectedSeasons` state, and reactively re-runs `processSwimData()`
on the season-filtered subset. The existing views are unchanged — they still
receive a `processedData` object, just one scoped to the selected seasons.

Rejected alternatives:
- Filtering already-processed races in the dashboard — PR/improvement values were
  computed across all years, so season-scoped views would show all-time PRs.
- Per-view season filtering in the util — conflicts with the shared-filter
  decision and duplicates state.

## Changes by file

### `src/lib/utils/swimData.js`
- Attach `season` (the meet's calendar year as a number, e.g. `2025`) to each
  processed race.
- Add `seasons` to the returned `filters` — all years present, sorted descending.
- Extend `filterRaces` to accept a `seasons` array: keep a race when `seasons` is
  empty/undefined or includes `race.season`.
- Export `getDefaultSeasons(allSeasons, currentYear)` → `[currentYear]` if it has
  data, else `[max(allSeasons)]`. Returns `[]` when there is no data.

### `src/lib/components/swim-tracker/SwimDashboard.svelte`
- Props change from `{ processedData, meets, swimmerEmojis }` to
  `{ meets, races, swimmerEmojis }` (raw arrays).
- Derive `allSeasons` from `meets` (all years, descending).
- Initialize `selectedSeasons` via `getDefaultSeasons(allSeasons, <current year>)`.
- Reactive: filter raw `meets`/`races` to the selected seasons →
  `processedData = processSwimData(filteredMeets, filteredRaces)`; pass
  `processedData` to the three data views and `filteredMeets` to
  `MeetPerformanceChart`.
- **Season filter UI:** a row of toggle chips (one per year) above the tab nav,
  styled like the existing nav tabs, plus a small "All" toggle. Rendered only when
  there is more than one season. Clearing all chips shows each view's existing
  empty state.

### `src/routes/swim-tracker/+page.svelte`
- Stop calling `processSwimData`. Pass raw `meets`/`races` to `SwimDashboard`.

### `src/routes/swim-tracker/family/+page.svelte`
- Stop calling `processSwimData`. Pass `data.meets`/`data.races` to
  `SwimDashboard`.

## Testing (`src/lib/data/.../swimData.test.js` or util test)

Extend the existing `swimData.test.js`:
- `season` is attached to processed races and equals the meet's year.
- `filters.seasons` lists all present years, sorted descending.
- `getDefaultSeasons` returns `[currentYear]` when present and `[latestYear]` when
  the current year has no data.
- `filterRaces` honors the `seasons` array (and is a no-op when `seasons` is
  empty/undefined).

## Demo impact

With the 2026 system date and 2025-only demo data, the demo falls back to showing
2025 (the latest year) by default. Because there is only one season, the chip row
stays hidden, so the public demo looks unchanged until multi-year data exists. The
family page gets the visible filter as soon as its sheet spans two summers.

## Out of scope

- No per-view independent season selection.
- No "Summer YYYY" style labels.
- No persistence of the selected seasons across reloads.
- No changes to the meets/races data schema.
