# Dog Breed Guessing Game (`/dog-vote`) — Design

**Date:** 2026-10-23
**Status:** Draft (pending builder check + owner approval)

## Intent

Our dog Luke is a mystery mix. A Wisdom Panel DNA test is out, with results a few weeks away. Until then, friends and family guess his breed breakdown. Once results land we flip a switch, everyone sees the real answer with an animated reveal, and the guesses get scored on a leaderboard.

Almost everyone will open the link from a text message, so **design for phones first**: one thumb, short attention span, no login. The page should be fun, warm, playful and built around photos. It doesn't need to match the sandbox's look.

**Several dogs:** this first runs for Luke, but friends should be able to run it for their own dogs later. Each dog is a slug (`/dog-vote/luke`) with its own Google Sheet. Adding a dog means **adding a sheet, an env var and a photo folder, with no code changes**. The dog's display name, intro text and pronoun live in the sheet, not in code.

> **Privacy note:** the owner has OK'd Luke's name and photos in this public repo (photos go in `static/dog-vote/luke/`). Every other identifier in code, tests and docs uses fictional placeholders (`biscuit`, `DOGVOTE_BISCUIT_SHEET_ID`). Voters' names and comments live only in the Google Sheet, never in the repo. Per `CLAUDE.md`, the sheet ID and service-account key are secrets: env vars only.

## Goals

- Collect guesses with as little friction as possible on a phone.
- Hide the crowd's guesses until you've guessed yourself, so people aren't anchored by others.
- Give a satisfying, shareable reveal and leaderboard once results are in.
- Run several dogs from one codebase.

## Non-goals

- Real identity or authentication. A name is just a label. Anyone can type someone else's name and replace their guess. This is a friendly game among people who know each other, and that's acceptable.
- Rate limiting or spam protection beyond the server-side checks below. (A hidden honeypot field is a cheap optional extra; builder's call.)
- An admin UI. The owner edits the Google Sheet directly to change the breed list, enter results and flip `revealed`.
- An `-embed` route. `CLAUDE.md`'s embed convention doesn't fit: this is a standalone page shared by text, not an iframe widget. *(My call.)*

## Anti-goals (failing even if it technically works)

- Fiddly percentage entry on a phone. If making the numbers add up to 100 is a chore, people give up.
- Google credentials, the sheet ID or Google API calls reaching the browser.
- A visitor seeing the crowd's guesses before submitting their own (through the normal UI).
- Breaking or changing the URL of any existing sandbox route.

## Current state: what was found in the repo

- **Swim-tracker doesn't use the Sheets API.** It reads published-to-web CSV URLs held in server-side env vars (`src/lib/server/swimGate.js`, `src/lib/utils/googleSheetsCSV.js`) and only ever reads. The pieces reused here are its **organization**:
  - per-slug env vars, discovered at runtime;
  - half-configured counts as unconfigured (`src/lib/server/families.js`);
  - Google access only in `$env/dynamic/private` server code with `prerender = false`;
  - JS with JSDoc (not TS), and vitest `*.test.js` beside the source.
- Writing needs something new: **a service account plus the Sheets REST API v4.**
- `src/routes/+layout.js` sets `prerender = true` globally. Every dog-vote server file must set `prerender = false`.
- `src/routes/+layout.svelte` applies global `body` styles (max-width 800px, padding, grey background) plus a nav bar and a white card. In SvelteKit the root layout always applies, even under a layout reset (`+layout@.svelte` resets *to* the root layout), so a route group is needed.
- Svelte 5 and SvelteKit 2, deployed to Vercel with `adapter-vercel` through the `vercel` CLI.

## Architecture

### Route structure (layout isolation)

```
src/routes/
  +layout.svelte              (CHANGED → bare <slot />; no styles)
  +layout.js                  (unchanged: prerender = true)
  (sandbox)/                  (NEW group; URLs unchanged)
    +layout.svelte            (today's root layout content, moved verbatim)
    +page.svelte              (git mv from routes/)
    swim-tracker/…            (git mv)
    family-math/…             (git mv)
  (dog-vote)/dog-vote/
    +layout.svelte            (own fonts, background, body reset)
    +page.server.js           (redirect → /dog-vote/<DOGVOTE_DEFAULT_SLUG>; 404 if unset)
    [dog]/+page.server.js     (load: settings, breeds, count, reveal data)
    [dog]/+page.svelte        (state machine: landing → form → crowd | reveal)
  api/
    swim-data/…               (stays put; +server files ignore layouts)
    dog-vote/[dog]/vote/+server.js    (POST: validate + append)
    dog-vote/[dog]/crowd/+server.js   (GET: crowd view, see "Crowd gating")
```

Moving the existing routes is `git mv` only, with no content edits. The one exception is the sandbox home page entry (Deliverables). Verify that every existing URL still renders identically, including the `-embed` routes, which depend on the pathname checks in the moved layout.

### Server modules (`src/lib/server/dogVote/`)

| Module | Job |
|---|---|
| `config.js` | Slug format check (same `^[a-z0-9]{2,32}$` as families), `getDogConfig(env, slug)` → `{ sheetId }` or `null`, and `getServiceAccount(env)` with clear errors for missing vars. |
| `googleAuth.js` | Service-account login with no dependencies: build an RS256 JWT with `node:crypto` (`createSign('RSA-SHA256')`), exchange it at `https://oauth2.googleapis.com/token` for an access token (scope `https://www.googleapis.com/auth/spreadsheets`), and cache the token in memory until ~60 s before it expires. |
| `sheets.js` | Thin REST wrappers: `batchGet(sheetId, ranges)` and `appendRow(sheetId, range, row)`, using `valueInputOption=RAW` (stops formula injection) and `insertDataOption=INSERT_ROWS`. Turns Google errors into readable messages, e.g. "tab `votes` not found" or "sheet not shared with <service-account email>". |
| `store.js` | `loadDog(slug)`: one `batchGet` of all four tabs, parsed and checked, with a **15 s in-memory cache per slug**. `appendVote(slug, vote)` reads `results!B1` fresh, refuses if revealed, appends, then clears that slug's cache. |
| `rules.js` | Pure functions, fully unit-tested: `validateVote`, `latestVotesByName`, `consensus`, `scoreGuess`, `buildReveal` (leaderboard + callouts). |

Note: the cache is per serverless instance on Vercel. That's fine for absorbing bursts. Two warm instances can disagree for up to 15 s, which is acceptable.

### Env vars

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=dog-vote@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DOGVOTE_BISCUIT_SHEET_ID=<spreadsheet id from the sheet URL>
DOGVOTE_DEFAULT_SLUG=biscuit
```

- Accept the private key with literal `\n` sequences (how Vercel and `.env` usually store it) and convert them to newlines.
- One service account serves every dog. Each dog's sheet is shared with that email as **Editor**.
- Add placeholder entries to `.env.example`.

### Errors in `npm run dev`

When config is missing or wrong, the dog page renders a friendly setup-error panel instead of crashing:

- In **dev**, it says exactly what's wrong: which env var is missing, which tab or header is missing, or that the sheet isn't shared with `<email>`.
- In **production**, it shows a generic "This game isn't set up yet." Secrets, sheet IDs and raw Google errors are never shown.

An unknown or unconfigured slug returns a 404.

## The Google Sheet (one per dog)

Four tabs. The header row is required and matched case-insensitively. Missing tabs or headers produce the clear errors above.

**`settings`**: key/value rows, headers `key | value`.

| key | value (example) | notes |
|---|---|---|
| `dog_name` | Biscuit | required |
| `pronoun` | he / she / they | drives copy ("what's in him?"); default `they` |
| `intro` | Short paragraph shown on the landing page | optional |
| `photos` | `1.jpg, 2.jpg, beach.jpg` | comma-separated, in display order. Bare filenames resolve to `/dog-vote/<slug>/<file>`; full `https://` URLs are used as-is. The first photo is the hero. |

**Photo hygiene:** phone photos carry GPS and device metadata. Before any photo is committed, resize it to at most 1600 px on the long edge and re-encode it with all metadata removed.
- macOS ImageIO through a small Swift script works with no installs.
- Verify by checking the file bytes, not Spotlight, which caches old metadata.
- The README's "adding photos" step must say this.
- Luke's first photo (`luke-grass.jpg`) has already been cleaned this way.

The sheet sets the photo order because the server can't reliably list the `static/` folder at runtime on Vercel, and this way the owner controls which photo leads. *(My call.)*

**`votes`**: append-only. Headers `timestamp | name | guesses | comment`.

- `timestamp` is an ISO-8601 UTC string written by the server.
- `guesses` is a JSON array: `[{"breed":"Beagle","pct":60},{"breed":"Boxer","pct":40}]`.
- Rows are never updated or deleted by the app.
- When reading, keep each name's **latest** row (by timestamp, with sheet order as the tie-break), comparing names case-insensitively after trimming and collapsing whitespace. Display the name as written in that latest row.
- Malformed rows (bad JSON and so on) are skipped and logged, never fatal.

**`breeds`**: headers `breed | group | image_url`. `image_url` is optional. This feeds the picker and maps breeds to Wisdom Panel–style groups.

**`results`**: layout is fixed and documented in the README:

```
     A                 B
1    revealed          FALSE        ← the switch (TRUE/FALSE, checkbox OK)
2    breed_or_group    pct          ← header
3    Beagle            37.5
4    Terrier group     22
…
```

- Read the range `results!A1:B200`.
- `pct` may have decimals (Wisdom Panel reports e.g. 12.5%).
- A row counts as a **group** if its name matches any `group` value in `breeds`. Otherwise it's a breed.
  - **Group-name normalization** applies everywhere: matching, the emoji/colour map and the seed CSV. Lowercase, trim, collapse whitespace, and strip a trailing " group".
  - So "Terrier group", "terrier Group" and "Terrier" all match the same group. *(My call, from the builder check.)*
- Rows may be filled in before flipping `revealed`; nothing is shown until B1 is TRUE.
- **Layout check:** if A1 isn't `revealed` or A2:B2 isn't `breed_or_group | pct`, treat it as a setup error. A common case is a stray row-number column shifting everything right. Show a clear message that names the problem; never quietly treat voting as open.
- B1 accepts TRUE/FALSE, a checkbox, or "true"/"false" text in any case.

## Voting flow (UI)

### Landing

- A hero photo, plus a swipeable strip if there's more than one.
- "What's in <name>?", the intro text, and "N people have guessed so far."
- A big **Make your guess** button.

### Guess form (mobile-first)

1. **Name**: required, trimmed, at most 50 characters.
2. **Breeds (1–5)**: a searchable picker over the `breeds` tab.
   - Each option shows the breed image, or the group emoji if there's no image.
   - If the search text doesn't match, offer "Add '<text>'" as a free-text breed.
   - Free-text breeds have no group.
   - Duplicates are blocked (case-insensitive).
3. **Percentages**: each chosen breed gets a slider plus −/+ stepper buttons in steps of 5, with 1 reachable through the slider.
   - **Auto-balance:** changing one breed spreads the difference across the others proportionally. Each stays at least 1, the total always stays exactly 100, and integers are kept by giving rounding leftovers to the largest.
   - Adding a breed takes its starting share proportionally from the others. Removing one hands its share back.
   - A running total ("100% ✓") is always visible.
   - With one breed it's fixed at 100.
4. **Comment**: optional, at most 280 characters, with a character counter.
5. **Submit**. The server's error messages show next to the fields.

### After submitting (and on return visits)

- **"Your guess"** card: their breakdown as a small bar or stacked strip.
- **Crowd consensus chart (D3)**: horizontal bars of the average % per breed across everyone's latest votes. A voter who didn't pick a breed counts as 0 for it. Shows the top 8 plus "Other", coloured by group.
- **Everyone's guesses**: newest first. Each shows name, breakdown chips and comment.
- **localStorage** key `dogvote:<slug>` stores `{ name, guesses, comment, submittedAt }`.
  - On return, the page skips straight to this view.
  - **Edit my guess** reopens the form pre-filled. Resubmitting with the same name replaces the old guess, because only the latest row counts.
  - All storage access is wrapped in try/catch so the page still works without it.

### Crowd gating

`GET /api/dog-vote/[dog]/crowd?name=<name>` returns the consensus and the vote list only if `name` matches an existing vote. Otherwise it returns just the count. This stops casual peeking through the API without pretending to be security. *(My call.)*

### Server validation (`POST /vote`; every rule enforced server-side)

- Name present after trimming, at most 50 characters.
- 1–5 guesses, breed names unique (case-insensitive), each 1–60 characters after trimming.
- Each `pct` is an integer from 1 to 100, and they sum to exactly 100.
- Comment at most 280 characters (empty allowed).
- Rejected with a 409 and "Voting is closed" when `revealed` is TRUE.
- A breed that matches a `breeds` entry (case-insensitive) is stored with the sheet's canonical spelling. Others are stored as typed (trimmed).

## Reveal mode (`results.revealed` = TRUE)

The page switches to reveal mode for everyone. Voting is closed: the form is hidden and the API rejects votes.

- **Animated reveal (D3):**
  - The actual breakdown builds up piece by piece with a short stagger, largest last for drama.
  - Each bar grows while its percentage counts up.
  - It respects `prefers-reduced-motion`.
  - A "Replay" button replays it.
  - The exact form (stacked bar, donut or bars) is left to the builder.
- **Leaderboard**: everyone's latest guess, ranked by score descending, ties broken by earliest vote timestamp. A returning visitor's own row is highlighted (via localStorage).
  - "Vote timestamp" here, and in the wildest-guess tie-break, means the timestamp of the **latest (counted) row**.
  - So an edit made after seeing the crowd loses ties to people who stood by their first guess. *(My call.)*
- **Callouts:**
  - **Closest guess**: the top of the leaderboard.
  - **Wildest guess**: the lowest score; ties go to the later vote.
  - **The crowd's score**: the full (not top-8) consensus vector scored like a guess.
  - **The most popular breed that wasn't in him at all**: the breed picked by the most voters that contributes 0 to anyone's score, meaning it's neither in the results nor in a group that is. Ties go to the higher average %. Omitted if there isn't one.

### Scoring (overlap, 0–100)

Normalize names (trim, lowercase, collapse whitespace). For one guess:

1. **Breed rows first.** For each actual *breed* row: `score += min(guessed % for that breed, actual %)`. Mark the matched guessed percentage as used.
2. **Then group rows.** For each actual *group* row G: take the guessed breeds whose `breeds`-tab group is G, sum their **unused** percentage (guessed minus any already used in step 1), then `score += min(that sum, actual %)`.
3. Free-text breeds with no group only match exact breed rows.
4. Round the score to one decimal for display.

The "unused" rule is my addition. It stops a guess being double-counted when the results contain both a specific breed and its group (e.g. "Jack Russell Terrier 30%" and "Terrier group 20%"), which keeps the score at 100 or below. When there's no such overlap, it matches the spec exactly.

## Visual design

- Warm, playful palette (cream background, warm accent), a rounded friendly display font from Google Fonts, big touch targets (44 px or more), photo-forward.
- Light mode only is acceptable. *(My call: an occasion page.)*
- **Breed visuals:**
  - Each group has a fixed emoji and colour in code, keyed by normalized group name. The exact emoji are the builder's call.
  - **Group vocabulary:** use Wisdom Panel–style group names (as they appear on its results), not AKC groups:
    - Terrier, Sporting, Herding, Scent Hound, Sighthound, Guardian, Working, Toy and Companion, Spitz and Primitive, Asian and Oceanian.
    - The builder should confirm the current list against Wisdom Panel's public breed-group pages and adjust.
  - The seed CSV uses these exact names with " group" appended (e.g. `Terrier group`).
  - **Any group the code doesn't know** (another owner's sheet, a renamed group) falls back to 🐕 and a neutral colour. No code change is needed. *(My call.)*
  - Group colours are reused in all charts and chips so breeds read consistently.
  - When `image_url` is set, the picker, chips and leaderboard show a small round breed photo, falling back to the group emoji if it fails to load.
- Use the `dataviz` skill when building the charts.

## Deliverables

- `src/lib/server/dogVote/*` with unit tests, `src/lib/components/dog-vote/*`, the routes above and the API endpoints.
- `docs/dog-vote/breeds-seed.csv`: about 60 common breeds, `breed,group,image_url`.
  - Image URLs come from the free Dog CEO image set (`images.dog.ceo`).
  - **Each URL must be checked to return HTTP 200 before it's included.** Leave the column blank where none is found.
- A **README section**:
  - required env vars;
  - creating the service account (Google Cloud project → enable Sheets API → service account → JSON key → copy `client_email` and `private_key`);
  - creating the sheet with the four tabs and exact headers, the `results` layout, sharing the sheet with the service-account email as Editor;
  - adding photos to `static/dog-vote/<slug>/`, and "adding another dog" in three steps.
- A sandbox home page entry linking to `/dog-vote`, per `CLAUDE.md`.
- `.env.example` placeholders.

## Testing

- **Vitest** for `rules.js`:
  - validation edge cases;
  - latest-vote dedupe (case/whitespace, ordering);
  - consensus and top-8 + Other;
  - scoring, including the group-sum, unused-percentage and free-text cases;
  - leaderboard tie-breaks and every callout.
- **Vitest** for the rest:
  - `config.js` (slug discovery, missing vars);
  - `googleAuth.js` JWT construction, signing with a key generated in the test;
  - sheet parsing in `store.js` with a mocked `fetch`, covering missing tab and header errors and the cache TTL and invalidation.
- **Manual:**
  - `npm run dev` against a real test sheet, walking through vote → crowd → edit → reveal at phone width (~390 px) and on desktop;
  - each existing sandbox route checked for no visual change;
  - `npm run build` succeeds.

## Left to the builder

Component breakdown, exact palette and fonts, the reveal animation's form, the photo-carousel implementation, the auto-balance algorithm details (within the rules above), and the copy.
