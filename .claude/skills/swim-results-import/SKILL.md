---
name: swim-results-import
description: Use when extracting or importing swim meet results from a PDF or pasted meet text into CSV for the swim tracker. Team and swimmers are read from a per-family config (config.<slug>.local.md), selected by family slug. Produces two review-ready CSVs (Meets + Races) matching the Google Sheet schema. Handles SwimTopia Meet Maestro result exports.
---

# Swim Results Import

Extract swim meet results from a PDF (or pasted meet text) into two CSV files that match
the swim-tracker Google Sheet schema, for manual review before pasting into the Sheet.

## Configuration (read this first)

This skill is **per-family**. Each family has its own gitignored config file
`config.<slug>.local.md` (co-located with this skill — they hold minors' names).

**Resolve the family slug first:**

1. Take the slug from the invocation — an explicit argument (e.g. `swim-results-import riverside`)
   or the user's request (e.g. "import this for the Riversides" → `riverside`).
2. If no slug is given or it is ambiguous, list the available `config.*.local.md` files and
   ask which family to import.
3. Resolve to exactly one `config.<slug>.local.md`. If a named slug has no matching file,
   say so and show the available slugs — do not guess.
4. If no `config.*.local.md` exists at all, tell the user to copy `config.example.md` to
   `config.<slug>.local.md` and fill it in, then stop. Do not hardcode names into committed files.

Read the resolved `config.<slug>.local.md` to get:

- our team's full name and its abbreviation as it appears in result rows,
- the swimmers to extract (full names + the initials used in RaceIds),
- the default pool size/unit,
- any name-collision watch-outs.

Throughout this skill, `<OUR_TEAM>` / `<OUR_ABBR>` and "the configured swimmers" refer to
values from that config. Extract ONLY races where a configured swimmer competed for
`<OUR_ABBR>`, including relays they were a leg of. **Match on the full last name** — other
swimmers may share a configured first name (see the collision notes in config).

- **Output directory:** `swim-imports/<slug>/` at the repo root (gitignored). Create it if
  missing. Source PDF (+ any extracted `.txt`) → `raw/`; scratch page renders →
  `work/` (deleted on success); the two durable CSVs sit directly in `<slug>/`.

## Prerequisite: reading the PDF

These are **SwimTopia Meet Maestro** exports. Put raw source files in
`swim-imports/<slug>/raw/` (gitignored). First extract the text layer:

```bash
pdftotext -layout <meet>.pdf <meet>.txt   # requires: brew install poppler
```

**Then decide the path by how much text came out:**

- **Text layer present** (the `.txt` has the events/finishers): work from the `-layout`
  text — the fast path, used by the rest of this skill. Producer is usually `Skia/PDF`
  (Chrome "Save as PDF").
- **Image-only PDF** (the `.txt` is essentially empty — e.g. `< ~100` bytes for a
  multi-page meet): the pages are flattened images with no recoverable text. `pdftotext`
  and every other text extractor return nothing. Producer is typically `Microsoft Print
  to PDF`, `PDFium`, or `Quartz`. **Switch to the image protocol below — do not ask.**

```bash
wc -c <meet>.txt                          # ~empty ⇒ image-only
pdffonts <meet>.pdf | tail -n +3          # no rows ⇒ no embedded fonts ⇒ image-only
pdfinfo  <meet>.pdf | grep -i producer    # Microsoft Print to PDF / PDFium / Quartz ⇒ image-only
```

## Image-only PDFs — render-and-read protocol

When the PDF is image-only, you read the data from rendered page images. **Two non-negotiable
rules:** (1) recorded times/places come ONLY from high-resolution by-eye crops, never from a
whole-page read or from OCR; (2) prove completeness with OCR-recovered text, not by trusting
your scan. Renders are scratch — they go in `swim-imports/<slug>/work/` and are deleted on success.

1. **Render quadrant crops at 300 DPI** into `work/`. A whole letter page at 300 DPI is
   2550×3300; split each page into four overlapping quadrants (the Read tool rejects images
   taller than ~2000px, and digit accuracy needs this resolution):
   ```bash
   for p in $(seq 1 <N>); do pp=$(printf "%02d" $p)
     pdftoppm -r 300 -png -f $p -l $p -x 0    -y 0    -W 1320 -H 1700 <meet>.pdf work/p${pp}-q1
     pdftoppm -r 300 -png -f $p -l $p -x 1240 -y 0    -W 1320 -H 1700 <meet>.pdf work/p${pp}-q2
     pdftoppm -r 300 -png -f $p -l $p -x 0    -y 1640 -W 1320 -H 1700 <meet>.pdf work/p${pp}-q3
     pdftoppm -r 300 -png -f $p -l $p -x 1240 -y 1640 -W 1320 -H 1700 <meet>.pdf work/p${pp}-q4
   done   # q1=top-left q2=top-right q3=bottom-left q4=bottom-right; pdftoppm appends -<page>
   ```
   (The Read tool's own PDF rendering may report "`pdftoppm` not installed" even when poppler
   IS installed — it's not on the Read tool's PATH. Render manually as above and Read the PNGs.)
   The centered page-header title ("<OUR_TEAM> at <host> — <date>") straddles the q1/q2 split,
   so read the meet name/date from a full-width header strip of page 1:
   `pdftoppm -r 300 -png -f 1 -l 1 -x 0 -y 0 -W 2550 -H 360 <meet>.pdf work/header`.
2. **OCR every quadrant to recover text for `grep`** (this restores the completeness check
   that image-only PDFs otherwise break). macOS has a built-in OCR engine via the Vision
   framework — no install — driven by `ocr-locate.swift` (co-located with this skill):
   ```bash
   > work/ocr_all.txt
   for f in $(ls work/p*-q*.png | sort); do
     echo "===== $f =====" >> work/ocr_all.txt
     swift <skill-dir>/ocr-locate.swift "$f" 2>/dev/null >> work/ocr_all.txt
   done
   grep -n "<Lastname>" work/ocr_all.txt          # locate every swimmer occurrence
   grep -nE "#[0-9]+ (Girls|Boys|Mixed|Men|Women)" work/ocr_all.txt | sort   # full event map
   ```
   OCR is a **locator and cross-check only** — it finds which quadrants hold each swimmer and
   builds the event list. **Never record a time or place from OCR;** Vision transposes digits
   in dense rows (observed: `1:41.07` read as `1:41.71`). If OCR isn't available (no `swift`,
   or a headless/non-macOS run), skip it and fall back to the age-group enumeration sweep in
   the verification pass.
3. **Read exact times/places by eye from the quadrant** the locator pointed to. If any digit
   is the least bit ambiguous, render a tight crop at 400–450 DPI and read that — treat the
   high-res crop as the authority:
   ```bash
   pdftoppm -r 450 -png -f <p> -l <p> -x <px> -y <py> -W 1900 -H <h> <meet>.pdf work/zoom
   ```
4. **Anchor every swim to its event by age group + place order** (column reflow plus by-eye
   reading compounds mis-assignment — see the parsing rules below).
5. **On success, delete `work/`** (`rm -rf work`). Keep the source PDF in `raw/` and the two
   CSVs in `<slug>/`. Label the final summary as read by eye from an image-only PDF, and note
   that a text-layer PDF (Chrome "Save as PDF" → `Skia/PDF`) or a SwimTopia CSV export would
   import exactly without this step.

## Meet Maestro format — parsing rules (read carefully)

**Result-row columns:** `Pl  Name  Age  Team  Seed  Official  Pts  Achv`. **`Place` is the
LEFT-most number** on the row (or `1`,`2`,`3`…, `--` for DQ, `X` for exhibition). **`Time` is
the `Official` column.** When a meet scores, a lone right-most digit is the `Pts` column — do
NOT mistake it for the place (e.g. `… 36.37  3` is time 36.37, *3 points*, with the place being
the leftmost number on that row). Per-event `Pts` is NOT a team score — see Workflow step 6.

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

1. **Resolve the family slug and read `config.<slug>.local.md`** (see Configuration).
2. **Extract the source text and pick the path** — text layer vs image-only (see
   prerequisite). Image-only ⇒ run the render-and-read protocol; everything else is identical.
3. **Meet date:** read it from the PDF header (e.g. "— Jun 10, 2026" / "06/10/2026"). Use
   the actual race date, NOT today's date and NOT the download date in the filename.
4. **Competing teams & opponent:** from result-row team abbreviations only (ignore record
   blocks). Opponent = the team that isn't `<OUR_ABBR>`. For a true 3+-team meet, set
   `NumTeams`; for a dual meet leave `TeamPlace`/`NumTeams` blank.
5. **Location:** `Away` if the meet name is "<OUR_TEAM> at <host>"; `Home` if hosted by
   `<OUR_TEAM>`; else blank. Capitalized (`Home`/`Away`), not lowercase.
6. **Score:** Meet Maestro individual-results exports usually have NO team score — leave
   `OurPoints`/`TheirPoints` blank (do not invent zeros). Only fill if a score is printed.
7. **Scan every event** for the configured swimmers on `<OUR_ABBR>`, including relays. A
   configured swimmer may not have swum this meet at all — that's fine; don't invent rows, and
   note who was absent in the summary.
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

`swim-imports/<slug>/<MeetId>-meets.csv` and `swim-imports/<slug>/<MeetId>-races.csv`.

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

1. **Completeness — find every swim.** Reconcile the count against your rows; relay legs list
   names as `1) Lastname, First (8)`, so don't miss a swimmer buried in a relay.
   - *Text path:* re-scan the source: `grep -n "<Lastname>" <meet>.txt`.
   - *Image path:* `grep -n "<Lastname>" work/ocr_all.txt` (from the OCR step). If OCR was
     unavailable, instead do an **age-group enumeration sweep**: determine each swimmer's age
     group from their result rows, then enumerate EVERY event of that age group + gender across
     all strokes (plus eligible relays) and confirm each was inspected by eye — including
     events with no hit. Also check the adjacent younger age group (a swimmer may swim down).
2. For each swim, confirm the event assignment via age group + place order (page-reflow trap).
3. Spot-check several times and places against the source. **On the image path every recorded
   digit must trace to a by-eye high-res crop, never to OCR or a whole-page read.**
4. Confirm every Races `MeetId` equals the single Meets `MeetId`, and column counts match
   (Meets = 11, Races = 10).
5. *Image path only:* `work/` is deleted (`rm -rf work`); `raw/` keeps the source PDF.

## Final summary (print to the user)

```
Meet: <date> vs <Opponent> (<home/away>) — <score or "score not in this PDF">
  <Swimmer>: #35 25 Breaststroke, 36.25, 4 of 6
  ...
Wrote: swim-imports/<slug>/<MeetId>-meets.csv
       swim-imports/<slug>/<MeetId>-races.csv
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
- (Image-only) Recording a time/place from OCR or a whole-page read instead of a high-res
  by-eye crop — OCR transposes digits (`1:41.07`→`1:41.71`); OCR is for location only.
- (Image-only) Asking the user whether to switch to the image protocol — detect it and switch
  automatically; the one informational line goes in the final summary, not a prompt.
- (Image-only) Leaving `work/` renders behind, or putting renders anywhere but `work/`.
