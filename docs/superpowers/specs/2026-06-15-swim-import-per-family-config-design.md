# Swim Import — Per-Family Config — Design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)

## Goal

Let the `swim-results-import` skill produce results for **more than one family** by selecting a per-family config at invocation. Each family has its own gitignored config file (team + roster + pool + collision notes); the skill resolves which family to run, reads that config, and writes that family's CSVs to a per-family output directory. One run handles one family (run it again for another). The extraction/parsing logic is unchanged.

> Privacy: this repo is public and these configs hold minors' names. This spec uses only the fictional placeholder slug `riverside` and `<slug>` placeholders. No real family name appears here. Real slugs live only in gitignored `config.<slug>.local.md` filenames, never in committed files.

## Background / Current State

`.claude/skills/swim-results-import/`:
- `SKILL.md` — reads a single `config.local.md` for one team (`<OUR_TEAM>`/`<OUR_ABBR>`) and one swimmer roster; extracts only races where a configured swimmer competed; writes flat to `swim-imports/<MeetId>-meets.csv` / `-races.csv` (raw under `swim-imports/raw/`).
- `config.example.md` — PII-free template (tracked).
- `config.local.md` — the one real config (gitignored).

`.gitignore` ignores only the literal `…/config.local.md`. The skill has no concept of "family"; it cannot discover other families from a PDF (a meet has teams + swimmers, not families), and name collisions are handled by explicit last-name matching — so each family's roster must be listed.

## Decisions (from brainstorming)

1. **Config scheme:** per-family files `config.<slug>.local.md`; **migrate** the existing `config.local.md` to a slugged file; no unslugged default.
2. **Slug selection:** use the slug from the invocation (explicit arg or natural-language request); if absent/ambiguous, list discovered configs and ask.
3. **Output routing:** per-slug subdirectory `swim-imports/<slug>/…`.
4. **Scope:** one family per run (run twice for a PDF covering two families). NOT multi-roster single-pass.

## Architecture / Changes

Four edits, all within `.claude/skills/swim-results-import/` plus `.gitignore`. No code (the skill is Markdown instructions + config files).

### 1. `.gitignore` — cover all per-family configs (safety-critical)

Replace the single literal ignore with a glob (keep the literal too, belt-and-suspenders):

```
# Personal swim-import skill config (real swimmer/team names — never commit)
.claude/skills/swim-results-import/config.local.md
.claude/skills/swim-results-import/config.*.local.md
```

- `config.*.local.md` matches `config.<slug>.local.md` for any slug.
- It does NOT match `config.example.md` (no `.local.md` suffix), so the template stays tracked.
- It does NOT match the bare `config.local.md` (kept by the explicit first line for safety).

### 2. Migration — slug the existing config

Rename `config.local.md` → `config.<slug>.local.md` (the owner's own family slug). This touches a gitignored file only; the real slug never enters a committed file. After migration there is no unslugged default.

### 3. `config.example.md` — per-family template

- Instructions change from "copy this to `config.local.md`" to "copy this to `config.<slug>.local.md`, where `<slug>` is this family's lowercase `[a-z0-9]` slug (ideally the same slug used for the family's results page)."
- Add a **Slug** field near the top (e.g. `**Slug:** <slug>`), documented as the config selector + output-directory name.
- All other content (team, roster table, pool default, collision notes) unchanged. Remains PII-free and tracked.

### 4. `SKILL.md` — parameterize selection, config source, and output

**Frontmatter `description`:** change "Team and swimmers are read from a local config (config.local.md)" → "Team and swimmers are read from a per-family config (config.<slug>.local.md), selected by family slug."

**New first workflow step — resolve the family slug:**
1. Determine the slug from the invocation: an explicit argument (`swim-results-import <slug>`) or the user's natural-language request (e.g. "import this for the Riversides" → `riverside`).
2. If none is given or it is ambiguous, list the discovered `config.<slug>.local.md` files and ask which family.
3. Resolve to exactly one `config.<slug>.local.md`. If a named slug has no matching file, say so and show the available slugs — do not guess.
4. If no per-family config exists at all, tell the user to copy `config.example.md` → `config.<slug>.local.md` and stop.
5. Read the resolved `config.<slug>.local.md` as the run's config (the existing Configuration section now refers to this resolved file instead of `config.local.md`).

**Configuration section:** every reference to `config.local.md` becomes "the resolved `config.<slug>.local.md`". The "if it does not exist" guidance points to copying `config.example.md` → `config.<slug>.local.md`.

**Output paths (replace flat with per-slug):**
- Raw source: `swim-imports/<slug>/raw/`.
- CSVs: `swim-imports/<slug>/<MeetId>-meets.csv` and `swim-imports/<slug>/<MeetId>-races.csv`.
- Update the "Output directory", "Output files", filename, and "Final summary" references accordingly.

**Unchanged:** all parsing rules (two-column `-layout` reflow, record-holder traps, status codes `DQ`/`NS`/`SCR`/`EXH`), naming conventions (MeetId/MeetName from team abbreviations), normalization table, and the verification pass. Only the config source and output location are parameterized.

## Data Flow

1. User invokes the skill, optionally naming a family.
2. Skill resolves the slug → `config.<slug>.local.md` (asking from the discovered list if needed).
3. Skill reads that config (team, roster, pool, collisions) and extracts from the PDF exactly as today.
4. Skill writes `swim-imports/<slug>/<MeetId>-{meets,races}.csv` and prints the summary, reminding the user to paste into **that family's** Google Sheet.

## Error Handling

- Named slug with no matching config → stop, list available slugs (no guessing).
- No per-family configs at all → instruct to create one from `config.example.md`, stop.
- Ambiguous/absent slug → list and ask.

## Testing / Verification

No automated harness (Markdown + gitignored configs). Verify by:
- **Migration & privacy:** `config.local.md` gone, `config.<slug>.local.md` present; `git check-ignore` confirms `config.*.local.md` is ignored and `config.example.md` is NOT ignored; `git status` shows no per-family config staged.
- **Consistency sweep:** grep `SKILL.md` for leftover `config.local.md` and flat `swim-imports/<MeetId>` paths — none should remain except where describing the per-slug scheme.
- **Live dry-run (interactive):** invoke the skill with a slug on a real meet PDF; confirm it reads the matching `config.<slug>.local.md`, writes under `swim-imports/<slug>/`, and reproduces the same correct CSVs for that family. A second family's config + run lands in its own subdir with no collision.

## Out of Scope (YAGNI)

- Multi-roster single-pass (splitting one PDF across families in one run).
- Any change to parsing/normalization/verification logic.
- Writing to Google Sheets directly (still manual paste, per family).
- Coupling to the viewer's env scheme (slug is only a config selector + output-dir name; matching the viewer slug is a recommended convention, not enforced).
