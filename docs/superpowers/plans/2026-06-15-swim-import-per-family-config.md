# Swim Import Per-Family Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `swim-results-import` skill multi-family by selecting a per-family config (`config.<slug>.local.md`) at invocation and routing output to a per-slug directory, with the gitignore widened so no per-family config can be committed.

**Architecture:** Markdown-skill change only (no code). Widen `.gitignore` to a glob, migrate the single `config.local.md` to a slugged file, update `config.example.md` into a per-family template, and re-parameterize `SKILL.md` (slug resolution + config source + output paths). Parsing/normalization/verification logic is untouched.

**Tech Stack:** Claude Code skill (Markdown `SKILL.md` + Markdown config files), git, shell (`git check-ignore`, `grep`).

---

## Privacy Rule (applies to EVERY task)

This repo is public and these configs hold **minors' names**. Per `CLAUDE.md` → "Privacy: Never Commit PII":
- This plan and all committed files use only the fictional `riverside` / `<slug>` / `<your-slug>` placeholders. Never a real family name.
- Real configs live only in gitignored `config.<slug>.local.md` files. The migration in Task 2 renames a **gitignored** file, so the real slug never enters a committed file.
- Run `git diff --cached` before each commit; if a real name or a `config.*.local.md` file is staged, stop.

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `.gitignore` | Ignore every per-family config (`config.*.local.md`) | Modify |
| `.claude/skills/swim-results-import/config.local.md` | The single existing real config | **Rename** → `config.<your-slug>.local.md` (gitignored) |
| `.claude/skills/swim-results-import/config.example.md` | PII-free per-family template (tracked) | Modify |
| `.claude/skills/swim-results-import/SKILL.md` | Slug resolution + per-family config source + per-slug output | Modify |

Order matters: **gitignore first** (Task 1) so the migrated file (Task 2) is covered the instant it exists.

---

### Task 1: Widen `.gitignore` to cover every per-family config

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Confirm the current state (per-family file is NOT yet ignored)**

Run: `git check-ignore -v .claude/skills/swim-results-import/config.riverside.local.md || echo "NOT IGNORED"`
Expected: prints `NOT IGNORED` (the glob isn't there yet).

- [ ] **Step 2: Update the ignore rule**

In `.gitignore`, replace this block:

```
# Personal swim-import skill config (real swimmer/team names — never commit)
.claude/skills/swim-results-import/config.local.md
```

with:

```
# Personal swim-import skill config (real swimmer/team names — never commit)
.claude/skills/swim-results-import/config.local.md
.claude/skills/swim-results-import/config.*.local.md
```

- [ ] **Step 3: Verify the glob ignores per-family files but NOT the template**

Run:
```bash
git check-ignore -v .claude/skills/swim-results-import/config.riverside.local.md
git check-ignore -v .claude/skills/swim-results-import/config.example.md && echo "BUG: example is ignored" || echo "OK: example.md stays tracked"
```
Expected: the first line reports a match against `config.*.local.md`; the second prints `OK: example.md stays tracked`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git diff --cached   # confirm only .gitignore, no PII
git commit -m "chore: ignore all per-family swim-import configs (config.*.local.md)"
```

---

### Task 2: Migrate the existing config to a slugged filename

**Files:**
- Rename: `.claude/skills/swim-results-import/config.local.md` → `.claude/skills/swim-results-import/config.<your-slug>.local.md`

> Both files are gitignored, so this is a plain `mv` with **nothing to commit**. Substitute `<your-slug>` with the owner's own family slug (lowercase `[a-z0-9]`). If you don't know it, ask the user — do not invent one. Do not write the real slug into any committed file.

- [ ] **Step 1: Confirm the source exists**

Run: `ls .claude/skills/swim-results-import/config.local.md`
Expected: the file exists. (If it does not, there is nothing to migrate — skip to Task 3.)

- [ ] **Step 2: Rename to the slugged filename**

Run (substitute the real slug for `<your-slug>`):
```bash
mv .claude/skills/swim-results-import/config.local.md \
   .claude/skills/swim-results-import/config.<your-slug>.local.md
```

- [ ] **Step 3: Verify the rename and that git ignores the result**

Run (substitute the real slug):
```bash
ls .claude/skills/swim-results-import/config.<your-slug>.local.md
ls .claude/skills/swim-results-import/config.local.md 2>/dev/null && echo "BUG: old file still present" || echo "OK: old file gone"
git status --porcelain .claude/skills/swim-results-import/   # must NOT list any config.*.local.md
```
Expected: the slugged file exists; `OK: old file gone`; `git status` shows no `config.*.local.md` (only the gitignored, untracked configs, which porcelain omits). **If any `config.*.local.md` appears as staged/untracked-to-be-added, STOP — the gitignore is wrong.**

- [ ] **Step 4: No commit**

Nothing to commit (both files are gitignored). Proceed to Task 3.

---

### Task 3: Update `config.example.md` into a per-family template

**Files:**
- Modify: `.claude/skills/swim-results-import/config.example.md` (entire file)

- [ ] **Step 1: Replace the file contents**

Overwrite `.claude/skills/swim-results-import/config.example.md` with:

```markdown
# Swim Results Import — config template

Copy this file to `config.<slug>.local.md` (which is gitignored) and fill in your real team
and swimmer details. `<slug>` is this family's lowercase `[a-z0-9]` slug — ideally the same
slug used for the family's results page. The skill resolves which config to read from the
family slug at invocation; if none exists, it asks you to create one from this template.

Keep real swimmer names only in `config.<slug>.local.md` files — never in committed files.

## Slug

- **Slug:** <slug>   (lowercase [a-z0-9]; also names the output dir `swim-imports/<slug>/`)

## Our team

- **Name (full):** <Your Team Name>
- **Abbreviation (as it appears in result rows' team column):** <ABBR>

## Swimmers to extract

Extract only races where one of these swimmers competed for our team (include relays they
were a leg of). Match on the full last name.

| First | Last | Initials (for RaceId) |
|-------|------|-----------------------|
| <First> | <Last> | <fl> |
| <First> | <Last> | <fl> |

## Pool default

- **PoolSize:** <e.g. 25>
- **PoolUnit:** <meters or yards>

## Name-collision watch-outs

List any other swimmers in your league who share a first name with one of yours, so the
skill matches the full last name and doesn't grab the wrong kid. (Optional.)

- <e.g. "Firstname Otherlast" — different swimmer>
```

- [ ] **Step 2: Verify it is still tracked and PII-free**

Run:
```bash
git check-ignore .claude/skills/swim-results-import/config.example.md && echo "BUG: example ignored" || echo "OK: tracked"
grep -q "<First>" .claude/skills/swim-results-import/config.example.md && echo "OK: still a placeholder template" || echo "BUG: template lost its placeholders"
```
Expected: `OK: tracked` and `OK: still a placeholder template`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/swim-results-import/config.example.md
git diff --cached   # confirm no PII
git commit -m "docs: make swim-import config template per-family (config.<slug>.local.md)"
```

---

### Task 4: Re-parameterize `SKILL.md`

**Files:**
- Modify: `.claude/skills/swim-results-import/SKILL.md`

Apply the following edits exactly. (Each is a unique find→replace.)

- [ ] **Step 1: Frontmatter description**

Replace:
```
description: Use when extracting or importing swim meet results from a PDF or pasted meet text into CSV for the swim tracker. Team and swimmers are read from a local config (config.local.md). Produces two review-ready CSVs (Meets + Races) matching the Google Sheet schema. Handles SwimTopia Meet Maestro result exports.
```
with:
```
description: Use when extracting or importing swim meet results from a PDF or pasted meet text into CSV for the swim tracker. Team and swimmers are read from a per-family config (config.<slug>.local.md), selected by family slug. Produces two review-ready CSVs (Meets + Races) matching the Google Sheet schema. Handles SwimTopia Meet Maestro result exports.
```

- [ ] **Step 2: Configuration section (add slug resolution; switch to the resolved config)**

Replace this block:
```
## Configuration (read this first)

Real team and swimmer details live in **`config.local.md`** (co-located with this skill,
gitignored — it holds minors' names). Before extracting, Read `config.local.md` to get:

- our team's full name and its abbreviation as it appears in result rows,
- the swimmers to extract (full names + the initials used in RaceIds),
- the default pool size/unit,
- any name-collision watch-outs.

If `config.local.md` does not exist, tell the user to copy `config.example.md` to
`config.local.md` and fill it in, then stop. Do not hardcode names into this file.
```
with:
```
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
```

- [ ] **Step 3: Output directory line**

Replace:
```
- **Output directory:** `swim-imports/` at the repo root (gitignored). Create it if missing.
```
with:
```
- **Output directory:** `swim-imports/<slug>/` at the repo root (gitignored). Create it if missing.
```

- [ ] **Step 4: Raw-source path in the prerequisite**

Replace:
```
Work from the `-layout` text. Put raw source files in `swim-imports/raw/` (also gitignored).
```
with:
```
Work from the `-layout` text. Put raw source files in `swim-imports/<slug>/raw/` (also gitignored).
```

- [ ] **Step 5: Workflow step 1**

Replace:
```
1. **Read `config.local.md`** (see Configuration).
```
with:
```
1. **Resolve the family slug and read `config.<slug>.local.md`** (see Configuration).
```

- [ ] **Step 6: Output files section**

Replace:
```
## Output files

`swim-imports/<MeetId>-meets.csv` and `swim-imports/<MeetId>-races.csv`.
```
with:
```
## Output files

`swim-imports/<slug>/<MeetId>-meets.csv` and `swim-imports/<slug>/<MeetId>-races.csv`.
```

- [ ] **Step 7: Final-summary "Wrote:" lines**

Replace:
```
Wrote: swim-imports/<MeetId>-meets.csv
       swim-imports/<MeetId>-races.csv
```
with:
```
Wrote: swim-imports/<slug>/<MeetId>-meets.csv
       swim-imports/<slug>/<MeetId>-races.csv
```

- [ ] **Step 8: Verify no stale references remain**

Run:
```bash
cd .claude/skills/swim-results-import
grep -n "config.local.md" SKILL.md && echo "BUG: stale config.local.md ref" || echo "OK: no config.local.md refs"
grep -nE "swim-imports/<MeetId>" SKILL.md && echo "BUG: stale flat output path" || echo "OK: no flat output paths"
grep -n "config.<slug>.local.md" SKILL.md >/dev/null && echo "OK: per-family config referenced"
grep -n "swim-imports/<slug>/" SKILL.md >/dev/null && echo "OK: per-slug output referenced"
cd -
```
Expected: `OK: no config.local.md refs`, `OK: no flat output paths`, `OK: per-family config referenced`, `OK: per-slug output referenced`.

- [ ] **Step 9: Commit**

```bash
git add .claude/skills/swim-results-import/SKILL.md
git diff --cached   # confirm no PII
git commit -m "feat: parameterize swim-import skill by family slug (config + output)"
```

---

### Task 5: Final verification

**Files:** none (verification).

- [ ] **Step 1: Privacy + gitignore audit**

Run (set `SLUG` to the owner's real slug at runtime — it stays in the shell, never committed):
```bash
SLUG="<your-slug>"
git status --porcelain .claude/skills/swim-results-import/   # no config.*.local.md may appear
git check-ignore ".claude/skills/swim-results-import/config.$SLUG.local.md" && echo "OK: real config ignored"
git diff main..HEAD | grep -iE "^\+" | grep -i "$SLUG" | grep -viE "riverside" && echo "BUG: real slug appears in committed diff" || echo "CLEAN: real slug not in branch diff"
```
Expected: no `config.*.local.md` in status; `OK: real config ignored`; `CLEAN: real slug not in branch diff`.

- [ ] **Step 2: Consistency sweep (whole skill dir)**

Run:
```bash
grep -rn "config.local.md" .claude/skills/swim-results-import/ && echo "REVIEW: refs to old default" || echo "OK: no config.local.md references anywhere"
```
Expected: `OK: no config.local.md references anywhere` (the template and SKILL.md now reference `config.<slug>.local.md`).

- [ ] **Step 3: Live dry-run (interactive — user-driven)**

This step needs a real meet PDF and is the user's to run; it cannot be automated headlessly.
- Invoke the skill naming a family (e.g. `swim-results-import <your-slug>`) on a real meet PDF.
- Confirm it reads `config.<your-slug>.local.md`, writes to `swim-imports/<your-slug>/<MeetId>-{meets,races}.csv`, and reproduces correct CSVs for that family.
- Add a second family's `config.<other-slug>.local.md`, run again, and confirm output lands in `swim-imports/<other-slug>/` with no collision.

---

## Notes / Out of Scope

- No change to parsing/normalization/verification logic — configuration + output routing only.
- One family per run; a PDF covering two families means two runs (multi-roster single-pass is out of scope).
- The skill still writes CSVs for manual paste into each family's Google Sheet (no direct Sheet writes).
- Slug is only a config selector + output-dir name; matching the viewer's family slug is a recommended convention, not enforced.
