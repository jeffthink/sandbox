# Swim Results Import Skill — Design

**Date:** 2026-06-13
**Status:** Approved

## Purpose

Turn the existing manual PDF-extraction workflow (`src/routes/swim-tracker/PDF_IMPORT_TEMPLATE.md`)
into a reusable, auto-invoked Claude skill. The team and swimmers to track are read from a
gitignored local config (`config.local.md`) so no personal data lives in the committed
skill. Given a swim meet results PDF (or pasted meet text), the skill extracts the meet
metadata and the configured swimmers' race results into two CSV files matching the
existing Google Sheet schema, for manual review before pasting into the Sheet.

Out of scope: writing directly to Google Sheets (future automation).

## Skill Identity

- **Name:** `swim-results-import`
- **Location:** `.claude/skills/swim-results-import/SKILL.md` (project skill, checked in)
- **Trigger / description:** when the user wants to extract or import swim meet results
  from a PDF (or pasted meet text) into CSV for the swim tracker.

## Approach

Pure instructional skill (no helper script). PDF extraction is fundamentally a
reading/vision task, so the failure mode that matters — misreading a time or place, or
missing a race — is an *extraction* error that a format-validation script cannot catch.
That risk is addressed by a strong in-skill verification pass instead. Format
consistency (column order, time format, ID linkage) is guaranteed by being explicit in
the instructions. This keeps the skill a zero-dependency single file.

## Configuration (no PII in the repo)

Team and swimmer specifics are read at runtime from `config.local.md` (co-located with the
skill, gitignored). A committed `config.example.md` documents the format. The config holds:
our team's full name + abbreviation, the swimmers to extract (full names + RaceId initials),
the default pool size/unit, and name-collision watch-outs. The committed `SKILL.md` uses
placeholders only — minors' names never enter version control.

- **Output directory:** `swim-imports/` at repo root (created if missing, gitignored so
  real-name results are never committed — consistent with the repo's existing privacy gating).

## Output

Two CSV files per meet:

1. `swim-imports/<date>-<opponent-slug>-meets.csv` — one row.
   Columns: `MeetId,Date,MeetName,Opponent,Location,PoolSize,PoolUnit,OurPoints,TheirPoints,TeamPlace,NumTeams`
2. `swim-imports/<date>-<opponent-slug>-races.csv` — one row per kid's swim.
   Columns: `RaceId,MeetId,Swimmer,EventNumber,AgeGroup,Distance,Stroke,Time,Place,NumSwimmers`

`<date>` is `YYYY-MM-DD`; `<opponent-slug>` is the opponent name lowercased and
hyphenated.

## Extraction Rules

- **Date** comes from the PDF (the actual race date), NOT today's date. (This fixes a
  bug in the current `PDF_IMPORT_TEMPLATE.md`, which says to use today's date.)
- **MeetId** = `YYYY-MM-DD-<opponent-slug>`.
- **RaceId** = `YYYY-MM-DD-<event#>-<swimmer-initial>` (Q/M/E). For relays, append a
  short suffix so IDs stay unique (e.g. `-relay`).
- **Swimmer** column uses first name only (single family tracked); match the full last
  name from config to avoid grabbing a different swimmer who shares a first name.
- **Strokes** normalized to full names: Free→Freestyle, Back→Backstroke,
  Breast→Breaststroke, Fly→Butterfly, IM→IM.
- **Times** normalized to `SS.SS` (under a minute) or `M:SS.SS` (a minute or more).
  Strip reaction-time prefixes; use final swim time only.
- **DQ:** put `DQ` in both Time and Place.
- **Missing meet score:** leave `OurPoints` and `TheirPoints` blank — do not invent
  zeros.
- **Location:** `home` or `away` if determinable from the PDF, else blank.
- **Optional fields** (TeamPlace, NumTeams) for dual meets: blank when not applicable.
- Any other unknown field: leave blank rather than guess.

## Verification Pass (before finishing)

1. Re-scan the PDF for every event; confirm no configured swimmer's race was missed —
   especially multi-swimmer heats and relays where a swimmer's name may be one of several.
2. Spot-check a sample of times and places against the source text.
3. Confirm every Races row's `MeetId` matches the single Meets row's `MeetId`.
4. Confirm column counts and order match the schema exactly.

## User-Facing Output

After writing the two files, print a compact summary so the user can eyeball it before
pasting into the Sheet:

- Meet line: date, opponent, score (or "score not found").
- Per-kid race list: event, distance + stroke, time, place.
- The two output file paths.

## Testing

Dry-run the finished skill against a sample meet text block (covering an individual
swim, a relay, a DQ, and a missing-score case) to confirm it produces two
correctly-shaped CSV files and a sensible summary.

## Deviations Allowed (defaulted, user-overridable)

- Filename pattern `<date>-<opponent>-meets.csv` / `-races.csv`.
- Blank (not `0`) score when not found.
