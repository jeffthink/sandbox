---
name: swim-results-import
description: Use when extracting or importing swim meet results from a PDF or pasted meet text into CSV for the swim tracker. Team and swimmers are read from a local config (config.local.md). Produces two review-ready CSVs (Meets + Races) matching the Google Sheet schema. Handles SwimTopia Meet Maestro result exports.
---

# Swim Results Import

Extract swim meet results from a PDF (or pasted meet text) into two CSV files that match
the swim-tracker Google Sheet schema, for manual review before pasting into the Sheet.

## Configuration (read this first)

Real team and swimmer details live in **`config.local.md`** (co-located with this skill,
gitignored — it holds minors' names). Before extracting, Read `config.local.md` to get:

- our team's full name and its abbreviation as it appears in result rows,
- the swimmers to extract (full names + the initials used in RaceIds),
- the default pool size/unit,
- any name-collision watch-outs.

If `config.local.md` does not exist, tell the user to copy `config.example.md` to
`config.local.md` and fill it in, then stop. Do not hardcode names into this file.

Throughout this skill, `<OUR_TEAM>` / `<OUR_ABBR>` and "the configured swimmers" refer to
values from that config. Extract ONLY races where a configured swimmer competed for
`<OUR_ABBR>`, including relays they were a leg of. **Match on the full last name** — other
swimmers may share a configured first name (see the collision notes in config).

- **Output directory:** `swim-imports/` at the repo root (gitignored). Create it if missing.

## Prerequisite: reading the PDF

These are **SwimTopia Meet Maestro** exports. Claude's Read tool needs `poppler` to render
PDF pages; if it's missing, extract text with layout preserved instead:

```bash
pdftotext -layout <meet>.pdf <meet>.txt   # requires: brew install poppler
```

Work from the `-layout` text. Put raw source files in `swim-imports/raw/` (also gitignored).

## Meet Maestro format — parsing rules (read carefully)

**Two-column layout.** `-layout` text interleaves a LEFT and RIGHT column on each line.
Events flow down one column then the other, and **page breaks reflow the columns** — a
single event's finishers can split across a page boundary and appear to jump columns.
Never trust column position alone. **Anchor every swim to its event by matching the age
group and the place sequence** (places run 1,2,3… within an event; ages fit the event's
age group). This is the #1 source of mis-assignment — verify it.

**Record-holder lines are NOT competing teams.** Each event header is followed by a record
block like:

```
HOME    Some Name                            2025    25.52
        Some Swim Club
```

That is the pool/league **record holder** and their club. A club that appears ONLY in
these record blocks is NOT in the meet. (Watch for this: a club named only as a record
holder can be mistaken for a third team — it usually isn't.)
**Determine the competing teams solely from the team-abbreviation column in result rows**
(your `<OUR_ABBR>` and the opponent's code). Usually that's two teams → a dual meet.

**`HOME` at the END of a result row** is an achievement flag (new pool/home record), not a
team and not a place.

**Status codes in the time/place column:**

| Code | Meaning | Action |
|------|---------|--------|
| `DQ` | Disqualified (swam) | Include row; `DQ` in both Time and Place |
| `NS` | No swim | Skip — no row |
| `SCR` | Scratched | Skip — no row |
| `X … EXH` | Exhibition (swam, doesn't score) | Include if it's a configured swimmer; `EXH` in Place, real time in Time |

## Workflow

1. **Read `config.local.md`** (see Configuration).
2. **Extract the source text** (see prerequisite).
3. **Meet date:** read it from the PDF header (e.g. "— Jun 10, 2026" / "06/10/2026"). Use
   the actual race date, NOT today's date and NOT the download date in the filename.
4. **Competing teams & opponent:** from result-row team abbreviations only (ignore record
   blocks). Opponent = the team that isn't `<OUR_ABBR>`. For a true 3+-team meet, set
   `NumTeams`; for a dual meet leave `TeamPlace`/`NumTeams` blank.
5. **Location:** `Away` if the meet name is "<OUR_TEAM> at <host>"; `Home` if hosted by
   `<OUR_TEAM>`; else blank. Capitalized (`Home`/`Away`), not lowercase.
6. **Score:** Meet Maestro individual-results exports usually have NO team score — leave
   `OurPoints`/`TheirPoints` blank (do not invent zeros). Only fill if a score is printed.
7. **Scan every event** for the configured swimmers on `<OUR_ABBR>`, including relays.
8. **Write the two CSVs**, run the verification pass, print the summary.

## Naming: use team abbreviations, not full names

Use the team codes from the results' team column (ours is `<OUR_ABBR>`; the opponent's is
their own short code, e.g. `<OPP_ABBR>`). Full names appear ONLY in the `Opponent` column.

- `MeetId` = date + host-ordered team codes (lowercase): away → `<date>-<ours>-<opp>`;
  home → `<date>-<opp>-<ours>`.
- `MeetName` = `<OUR_ABBR> @ <OPP-ABBR> <year>` for an away meet, or
  `<OPP-ABBR> @ <OUR_ABBR> <year>` for a home meet. `@` marks the host's pool.
- Output filenames mirror the MeetId: `<MeetId>-meets.csv` and `<MeetId>-races.csv`.

## Output files

`swim-imports/<MeetId>-meets.csv` and `swim-imports/<MeetId>-races.csv`.

### Meets CSV — exactly one row

```
MeetId,Date,MeetName,Opponent,Location,PoolSize,PoolUnit,OurPoints,TheirPoints,TeamPlace,NumTeams
```
- `MeetId` / `MeetName` per the naming section above (abbreviations).
- `Date` = `YYYY-MM-DD` (from the PDF)
- `Opponent` = opponent's FULL name
- `PoolSize`/`PoolUnit` = the config default unless the PDF indicates otherwise
- `OurPoints`/`TheirPoints` = blank if no score; `TeamPlace`/`NumTeams` = blank for a dual

### Races CSV — one row per swimmer's swim

```
RaceId,MeetId,Swimmer,EventNumber,AgeGroup,Distance,Stroke,Time,Place,NumSwimmers
```
- `RaceId` = `<date>-<event#>-<initials>`, where `<event#>` is the `#NN` event number from
  the PDF and `<initials>` are the configured first+last initials (e.g. a swimmer "Jordan
  Lee" → `jl`). Event# + initials is already unique, so relays need no suffix; when two
  configured swimmers share a relay, write one row each.
- `Swimmer` = first name only.
- `AgeGroup` from the event header (e.g. `8 & Under`); `Distance` in the pool unit;
  `EventNumber` from the `#NN` header.
- `Time` = `SS.SS` or `M:SS.SS`; use the Official (final) time, two decimals.
- `Place` = the swimmer's finishing place; `NumSwimmers` = number of ranked finishers in
  that event (the highest place number). For relays: number of ranked relay teams.
- `DQ` → `DQ` in both Time and Place. Exhibition → `EXH` in Place.

## Normalization

| Source | Write as |
|--------|----------|
| Free | Freestyle |
| Back | Backstroke |
| Breast | Breaststroke |
| Fly | Butterfly |
| IM / I.M. | IM |
| Medley/Free Relay | `Medley Relay` / `Freestyle Relay` (Stroke), relay distance in Distance |
| `38.7`, `1:05.32` | `38.70`, `1:05.32` (two decimals) |

## Verification pass (before printing the summary)

1. Re-scan the source for EVERY occurrence of each configured swimmer's last name
   (`grep -n "<Lastname>"`); reconcile the count against your rows. Relay legs list names as
   `1) Lastname, First (8)` — don't miss a swimmer buried in a relay.
2. For each swim, confirm the event assignment via age group + place order (page-reflow trap).
3. Spot-check several times and places against the source.
4. Confirm every Races `MeetId` equals the single Meets `MeetId`, and column counts match
   (Meets = 11, Races = 10).

## Final summary (print to the user)

```
Meet: <date> vs <Opponent> (<home/away>) — <score or "score not in this PDF">
  <Swimmer>: #35 25 Breaststroke, 36.25, 4 of 6
  ...
Wrote: swim-imports/<MeetId>-meets.csv
       swim-imports/<MeetId>-races.csv
```

Flag any judgment calls (date source, pool size, multi-team opponent) for the user, and
remind them to review the CSVs before pasting into the Google Sheet.

## Common mistakes

- Counting a record-holder's club (in the `HOME … / Club` block) as a competing team.
- Mis-assigning a swim to the wrong event after a page-break column reflow.
- Using the filename/download date instead of the meet date in the PDF header.
- Inventing `0–0` when no score is printed.
- Grabbing a swimmer who shares a configured first name (match the full last name), or
  another team's swimmer.
- Missing a swimmer's leg inside a relay.
