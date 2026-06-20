# Swim Import — Image-Only PDFs & Folder Hygiene — Design

**Date:** 2026-06-16 (revised 2026-06-19)
**Status:** Implemented in `SKILL.md`. **2026-06-19 revision:** OCR is now IN scope as a
text-recovery *locator* (not a digit source) — see "OCR as locator" below and the Out-of-Scope
note. This change came out of the first live image-only run (a 13-page "Microsoft Print to PDF"
meet export), where OCR restored the `grep`-based completeness check and caught a by-eye digit
transposition (a relay time `1:41.07` mis-read as `1:41.71`).

## Goal

Make `swim-results-import` reliably handle **image-only PDFs** (no text layer — e.g. "Microsoft Print to PDF" / PDFium / Quartz exports) by auto-detecting them and switching to a render-and-read-by-eye protocol, and keep the `swim-imports/` output tree tidy by isolating and auto-deleting scratch render images.

> Privacy: this repo is public. This spec uses only the fictional `riverside` / `<slug>` placeholders. No real family or swimmer name appears here. All real data lives under the gitignored `swim-imports/` tree and gitignored `config.<slug>.local.md` files.

## Background

The skill's primary path is `pdftotext -layout <meet>.pdf` and parsing the extracted text. That works only when the PDF has a real text layer (selectable text, e.g. Chrome's `Skia/PDF` "Save as PDF" from the results web page). Some exports — notably "Microsoft Print to PDF", Chrome's PDF *viewer* (`PDFium`), and macOS `Quartz` — flatten text into vector shapes with **no `ToUnicode` mapping and no embedded font programs**, so `pdftotext` yields ~nothing (e.g. 9 bytes for a 9-page meet). No text extractor (poppler or any Python lib) can recover characters from such a file; only rendering the pages and reading them works.

This was hit in practice: a real meet PDF produced an empty text extraction, and the data had to be read from rendered page images. Reading at low/medium resolution caused digit errors (e.g. `17.28` instead of the correct `21.72`); only high-resolution quadrant crops were reliable, and completeness had to be verified by enumerating age-group events (no `grep` possible).

## Decisions (from brainstorming)

1. **On detecting image-only: auto by-eye, no prompt.** Switch to the render protocol automatically. Keep a single *informational* line in the final summary noting it was image-only and that a text-layer PDF / SwimTopia CSV export would import exactly. (Not a prompt.)
2. **Render cleanup: isolate + auto-delete on success.** Scratch renders go in `swim-imports/<slug>/work/`; after the CSVs are written and verified, delete `work/`. Keep the source PDF (+extracted text) in `raw/` and the CSVs in `<slug>/`.
3. **OCR as locator (2026-06-19).** Image-only PDFs break the skill's `grep`-based completeness check (no text to search). Use macOS's built-in Vision OCR (`ocr-locate.swift`, no install) on the quadrant renders to recover text *for `grep` and the event map only* — locating every swimmer occurrence and proving none were missed. **OCR is never the source of times/places** (Vision transposes digits in dense two-column tables); every recorded digit still comes from a by-eye high-res crop. OCR is optional with graceful fallback (no `swift` / headless / non-macOS ⇒ use the age-group enumeration sweep). This supersedes the original "OCR — out of scope" line.

## Changes (in `.claude/skills/swim-results-import/SKILL.md` + `ocr-locate.swift`)

The skill is Markdown instructions plus one supporting script (`ocr-locate.swift`, the Vision
OCR locator). The text-PDF path is unchanged.

### A. Detection step (after extracting source text)

After running `pdftotext -layout`, decide the path:

- If the extracted text is **essentially empty** (e.g. `< ~100` bytes for a multi-page meet), the PDF has **no text layer** → use the **image protocol** (below) automatically; do not ask.
- Optional confirmation signals: `pdfinfo` Producer (`Microsoft Print to PDF` / `PDFium` / `Quartz` ⇒ image-only; `Skia/PDF` ⇒ has text) and `ToUnicode` count (0 ⇒ none).
- Otherwise continue on the existing text path (unchanged).

### B. Image protocol (new section in SKILL.md)

When the PDF is image-only:

1. **Render with `pdftoppm` at 300 DPI** into `swim-imports/<slug>/work/`. Note explicitly: the Read tool's own PDF rendering may fail with "`pdftoppm` not installed" even when poppler IS installed (it isn't on the Read tool's PATH) — so render manually with `pdftoppm` and read the resulting PNGs.
2. **Render quadrant crops**, not whole pages: each page split into left/right × top/bottom (≈1290×1660 px at 300 DPI), e.g. `pdftoppm -r 300 -f N -l N -x <x> -y <y> -W 1290 -H 1660`. Two reasons:
   - the Read tool rejects images taller than ~2000px and limits multi-image requests, and
   - **digit accuracy requires this resolution** — reading exact times/places from whole-page or full-column renders is error-prone.
3. **Rule: read exact times/places only from quadrant-resolution images.** Never record a time/place from a whole-page or full-column read. A whole-page render may be used to locate events, but every recorded digit must come from a quadrant.
4. **Anchor every swim to its event by age group + place order** (existing rule; doubly important here, since column reflow plus by-eye reading compounds mis-assignment).

### C. Verification — completeness without `grep` (image path only)

The existing verification step 1 ("re-scan the source for every occurrence of each swimmer's last name via `grep`") is impossible without text. For the image path, replace it with an **age-group enumeration sweep**:

1. From the swims found, determine each configured swimmer's **age group** (their age appears in result rows; e.g. a 7-year-old ⇒ "8 & Under", a 10-year-old ⇒ "9-10").
2. Enumerate **every event** matching those age groups + gender across all strokes, plus the relays those age groups are eligible for, and confirm each was inspected — including events with no hit.
3. Keep the remaining verification checks (event anchoring; spot-check times/places; MeetId consistency; column counts Meets=11, Races=10).

The text path keeps the `grep`-based verification unchanged.

### D. Output labeling (image path)

The final summary states the data was **read by eye from an image-only PDF**, reminds the user to review the CSVs against the PDF before pasting into the Sheet, and adds the one informational line that a text-layer PDF (Chrome "Save as PDF" from the results page → `Skia/PDF`) or a SwimTopia CSV export would import exactly.

### E. Folder layout / hygiene

Standardize per family:

```
swim-imports/<slug>/
  <MeetId>-meets.csv        durable output
  <MeetId>-races.csv        durable output
  raw/<source>.pdf (+ .txt) durable source
  work/                     scratch renders — DELETED on success
```

- All page renders (`pdftoppm` output) go into `work/`.
- After the CSVs are written and pass verification, the skill removes `work/`.
- `swim-imports/` remains gitignored (already true), so nothing here is ever committed.
- Update the SKILL.md "Output directory" / "Prerequisite" / "Output files" references so raw source → `raw/` and renders → `work/`.

### F. One-time cleanup (during implementation)

Tidy the existing family `raw/` folder(s) that accumulated stray render PNGs this session: keep each meet's source PDF (and any extracted `.txt`) and the two CSVs; delete the leftover render images. Operational only — touches gitignored files, nothing committed.

## Testing / Verification

No automated harness (Markdown skill + gitignored data). Verify by:
- **Consistency sweep of SKILL.md:** the image protocol, detection threshold, `work/` usage, and quadrant rule are present; output paths point to `<slug>/`, `raw/`, `work/` consistently; the text path is unchanged.
- **Privacy:** spec/example/SKILL.md contain only fictional placeholders; `git status` shows no `swim-imports/` or `config.*.local.md` content staged.
- **Live dry-run (interactive, user):** on an image-only meet PDF, confirm the skill auto-detects (no prompt), renders into `work/`, produces correct CSVs in `<slug>/`, deletes `work/` on success, and labels the output as by-eye. On a text-layer PDF, confirm it still uses the fast `pdftotext` path with `grep` verification.

## Out of Scope (YAGNI)

- ~~OCR (tesseract)~~ — **revised 2026-06-19:** OCR is now used, but only as a *locator* via
  macOS Vision (`ocr-locate.swift`), not tesseract and not for digits. `tesseract` remains out
  of scope (not installed; worse on these tables). By-eye high-res crops remain the source of
  every recorded time/place.
- Automatic conversion of image-only PDFs to text (not possible without OCR).
- Any change to the CSV schema, the per-family config scheme, or the text-PDF parsing rules.
