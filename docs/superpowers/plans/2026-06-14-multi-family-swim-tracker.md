# Multi-Family Swim Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the swim tracker host a password-gated living dashboard for multiple families, each at its own friendly URL with isolated data — while every family shares one codebase, and no family identifier ever appears in the repo.

**Architecture:** A new server-side registry (`families.js`) discovers valid family slugs from environment variables at runtime and exposes a data-source "seam" (`authenticateFamily`, `loadFamilyData`) that wraps the existing `swimGate.js` primitives. A dynamic route `/swim-tracker/[family]` replaces the single static `family/` page; the API gains one `family` field. Swapping a family to a database later is a localized change behind the seam.

**Tech Stack:** SvelteKit v2, Vitest, Google Sheets CSV (via existing `swimGate.js`), Vercel serverless.

---

## Privacy Rule (applies to EVERY task)

Per `CLAUDE.md` → "Privacy: Never Commit PII", this repo is public. In all code, tests, docs, and `.env.example`:
- Use the fictional placeholder slug **`riverside`** only. Never a real family name.
- Real slugs/passwords/CSV URLs live exclusively in env vars (Vercel / a gitignored `.env`).
- Before each commit, run `git diff --cached` and confirm no real names, passwords, or Sheet URLs are staged.

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/lib/server/swimGate.js` | Low-level primitives: `verifyPassword`, `loadSwimData` | Unchanged |
| `src/lib/server/families.js` | Registry + data-source seam (slug discovery, config lookup, auth, load) | **Create** |
| `src/lib/server/families.test.js` | Unit tests for the registry/seam | **Create** |
| `src/routes/api/swim-data/+server.js` | Serverless POST; authenticate `{family, password}`, load data | Modify |
| `src/routes/swim-tracker/[family]/+page.svelte` | Dynamic gated page (refactor of old family page) | **Create** |
| `src/routes/swim-tracker/[family]/+page.js` | Disable prerender for the dynamic route | **Create** |
| `src/routes/swim-tracker/family/+page.svelte` | Minimal placeholder (never rendered; load redirects) | Replace contents |
| `src/routes/swim-tracker/family/+page.server.js` | Server redirect of legacy URL to owner's slug | **Create** |
| `.env.example` | Document the prefixed per-family env scheme | Modify |

Note on the seam: the spec named `verifyFamilyPassword` + `loadFamilyData`. This plan implements the verify step as **`authenticateFamily`**, which bundles slug lookup + password check and returns a *uniform* failure for all rejection cases (the no-enumeration guarantee lives in one testable place). `loadFamilyData` remains as specced.

---

### Task 1: Slug validation, discovery, and config lookup in `families.js`

**Files:**
- Create: `src/lib/server/families.js`
- Test: `src/lib/server/families.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/server/families.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { isValidSlugFormat, discoverSlugs, getFamilyConfig } from './families.js';

describe('isValidSlugFormat', () => {
	it('accepts lowercase alphanumeric slugs of valid length', () => {
		expect(isValidSlugFormat('riverside')).toBe(true);
		expect(isValidSlugFormat('team42')).toBe(true);
	});
	it('rejects uppercase, punctuation, spaces, and bad length', () => {
		expect(isValidSlugFormat('Riverside')).toBe(false);
		expect(isValidSlugFormat('river_side')).toBe(false);
		expect(isValidSlugFormat('river side')).toBe(false);
		expect(isValidSlugFormat('a')).toBe(false);
		expect(isValidSlugFormat('x'.repeat(33))).toBe(false);
	});
	it('rejects non-strings', () => {
		expect(isValidSlugFormat(undefined)).toBe(false);
		expect(isValidSlugFormat(null)).toBe(false);
		expect(isValidSlugFormat(42)).toBe(false);
	});
});

describe('discoverSlugs', () => {
	it('finds slugs from SWIM_<SLUG>_PASSWORD keys, lowercased', () => {
		const env = {
			SWIM_RIVERSIDE_PASSWORD: 'pw1',
			SWIM_LAKEVIEW_PASSWORD: 'pw2',
			SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/m'
		};
		expect(discoverSlugs(env).sort()).toEqual(['lakeview', 'riverside']);
	});
	it('ignores the legacy SWIM_PASSWORD and unrelated keys', () => {
		const env = { SWIM_PASSWORD: 'old', NODE_ENV: 'test' };
		expect(discoverSlugs(env)).toEqual([]);
	});
	it('ignores a password key whose value is empty', () => {
		const env = { SWIM_RIVERSIDE_PASSWORD: '' };
		expect(discoverSlugs(env)).toEqual([]);
	});
});

describe('getFamilyConfig', () => {
	const env = {
		SWIM_RIVERSIDE_PASSWORD: 'secret',
		SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/meets',
		SWIM_RIVERSIDE_RACES_URL: 'http://example.test/races',
		SWIM_RIVERSIDE_SWIMMERS_URL: 'http://example.test/swimmers'
	};
	it('returns the full config for a configured slug', () => {
		expect(getFamilyConfig(env, 'riverside')).toEqual({
			password: 'secret',
			meetsUrl: 'http://example.test/meets',
			racesUrl: 'http://example.test/races',
			swimmersUrl: 'http://example.test/swimmers'
		});
	});
	it('returns null for an unconfigured slug', () => {
		expect(getFamilyConfig(env, 'lakeview')).toBe(null);
	});
	it('returns null for an invalid slug format', () => {
		expect(getFamilyConfig(env, 'River_Side')).toBe(null);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/server/families.test.js`
Expected: FAIL — `Failed to resolve import "./families.js"` / functions not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/server/families.js`:

```js
import { verifyPassword, loadSwimData } from './swimGate.js';

/** Friendly slugs: lowercase alphanumeric, 2-32 chars. Keeps a clean,
 *  unambiguous mapping to the uppercase env-var prefix. */
const SLUG_PATTERN = /^[a-z0-9]{2,32}$/;

/**
 * @param {unknown} slug
 * @returns {boolean}
 */
export function isValidSlugFormat(slug) {
	return typeof slug === 'string' && SLUG_PATTERN.test(slug);
}

/**
 * Discover configured family slugs by scanning env keys of the form
 * SWIM_<SLUG>_PASSWORD (non-empty value). Returns lowercased slugs.
 * The legacy single-family SWIM_PASSWORD does not match and is ignored.
 * @param {Record<string, string|undefined>} env
 * @returns {string[]}
 */
export function discoverSlugs(env) {
	const slugs = [];
	for (const key of Object.keys(env)) {
		const match = /^SWIM_([A-Z0-9]+)_PASSWORD$/.exec(key);
		if (match && env[key]) {
			slugs.push(match[1].toLowerCase());
		}
	}
	return slugs;
}

/**
 * @param {string} slug
 * @returns {string} e.g. "riverside" -> "SWIM_RIVERSIDE"
 */
function envPrefix(slug) {
	return `SWIM_${slug.toUpperCase()}`;
}

/**
 * Return a family's data-source config, or null if the slug is invalid or not
 * configured. A family is "configured" when its SWIM_<SLUG>_PASSWORD is set.
 * @param {Record<string, string|undefined>} env
 * @param {string} slug
 * @returns {{ password: string, meetsUrl: string, racesUrl: string, swimmersUrl: string } | null}
 */
export function getFamilyConfig(env, slug) {
	if (!isValidSlugFormat(slug)) return null;
	const prefix = envPrefix(slug);
	const password = env[`${prefix}_PASSWORD`];
	if (!password) return null;
	return {
		password,
		meetsUrl: env[`${prefix}_MEETS_URL`],
		racesUrl: env[`${prefix}_RACES_URL`],
		swimmersUrl: env[`${prefix}_SWIMMERS_URL`]
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/server/families.test.js`
Expected: PASS (all `isValidSlugFormat`, `discoverSlugs`, `getFamilyConfig` tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/families.js src/lib/server/families.test.js
git commit -m "feat: add family registry slug discovery and config lookup"
```

---

### Task 2: Authentication seam (`authenticateFamily`) and `loadFamilyData`

**Files:**
- Modify: `src/lib/server/families.js`
- Test: `src/lib/server/families.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/server/families.test.js`:

```js
import { authenticateFamily, loadFamilyData } from './families.js';

describe('authenticateFamily (no enumeration)', () => {
	const env = {
		SWIM_RIVERSIDE_PASSWORD: 'secret',
		SWIM_RIVERSIDE_MEETS_URL: 'http://example.test/meets',
		SWIM_RIVERSIDE_RACES_URL: 'http://example.test/races'
	};

	it('succeeds with a correct family + password', () => {
		const res = authenticateFamily(env, { family: 'riverside', password: 'secret' });
		expect(res.ok).toBe(true);
		expect(res.config.meetsUrl).toBe('http://example.test/meets');
	});

	it('returns an identical failure for wrong password and unknown family', () => {
		const wrongPw = authenticateFamily(env, { family: 'riverside', password: 'nope' });
		const unknown = authenticateFamily(env, { family: 'lakeview', password: 'secret' });
		const badFormat = authenticateFamily(env, { family: 'River_Side', password: 'secret' });
		expect(wrongPw).toEqual({ ok: false });
		expect(unknown).toEqual({ ok: false });
		expect(badFormat).toEqual({ ok: false });
	});

	it('fails when family is missing or not a string', () => {
		expect(authenticateFamily(env, { family: undefined, password: 'secret' })).toEqual({ ok: false });
		expect(authenticateFamily(env, { family: 42, password: 'secret' })).toEqual({ ok: false });
	});
});

describe('loadFamilyData', () => {
	function fakeFetch(map) {
		return async (url) => {
			if (!(url in map)) return { ok: false, status: 404, text: async () => '' };
			return { ok: true, status: 200, text: async () => map[url] };
		};
	}

	it('loads and parses meets, races, and swimmers via the config', async () => {
		const config = {
			password: 'secret',
			meetsUrl: 'http://example.test/meets',
			racesUrl: 'http://example.test/races',
			swimmersUrl: 'http://example.test/swimmers'
		};
		const fetchImpl = fakeFetch({
			'http://example.test/meets': 'Name,Date\nSpring Invite,2026-05-01',
			'http://example.test/races': 'Swimmer,Time\nAva,30.12',
			'http://example.test/swimmers': 'Name,Emoji\nAva,🐬'
		});
		const data = await loadFamilyData(config, fetchImpl);
		expect(data.meets).toEqual([{ Name: 'Spring Invite', Date: '2026-05-01' }]);
		expect(data.races).toEqual([{ Swimmer: 'Ava', Time: '30.12' }]);
		expect(data.swimmers).toEqual([{ Name: 'Ava', Emoji: '🐬' }]);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/server/families.test.js`
Expected: FAIL — `authenticateFamily`/`loadFamilyData` are not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/server/families.js`:

```js
/**
 * Authenticate a family request. Returns a UNIFORM failure for all of:
 * invalid slug format, unknown/unconfigured family, and wrong password — so a
 * caller cannot distinguish them (no enumeration).
 * @param {Record<string, string|undefined>} env
 * @param {{ family: unknown, password: unknown }} body
 * @returns {{ ok: true, slug: string, config: { password: string, meetsUrl: string, racesUrl: string, swimmersUrl: string } } | { ok: false }}
 */
export function authenticateFamily(env, { family, password }) {
	const config = typeof family === 'string' ? getFamilyConfig(env, family) : null;
	if (!config || !verifyPassword(password, config.password)) {
		return { ok: false };
	}
	return { ok: true, slug: family, config };
}

/**
 * Load a family's swim data via the configured data source. This is the swap
 * point: to move one family to a database later, branch here on config.
 * @param {{ meetsUrl: string, racesUrl: string, swimmersUrl?: string }} config
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ meets: Array, races: Array, swimmers: Array }>}
 */
export function loadFamilyData(config, fetchImpl) {
	return loadSwimData({
		meetsUrl: config.meetsUrl,
		racesUrl: config.racesUrl,
		swimmersUrl: config.swimmersUrl,
		fetch: fetchImpl
	});
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/server/families.test.js`
Expected: PASS (all suites green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/families.js src/lib/server/families.test.js
git commit -m "feat: add family authentication seam and data loader"
```

---

### Task 3: Update the API endpoint to authenticate per family

**Files:**
- Modify: `src/routes/api/swim-data/+server.js` (entire file)

- [ ] **Step 1: Replace the file contents**

Overwrite `src/routes/api/swim-data/+server.js` with:

```js
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { authenticateFamily, loadFamilyData } from '$lib/server/families.js';

// This route is dynamic; override the global prerender = true from +layout.js.
export const prerender = false;

export async function POST({ request, fetch }) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	// One uniform 401 for bad slug format, unknown family, or wrong password.
	const auth = authenticateFamily(env, { family: body?.family, password: body?.password });
	if (!auth.ok) {
		throw error(401, 'Incorrect password');
	}

	try {
		const data = await loadFamilyData(auth.config, fetch);
		return json(data);
	} catch {
		// Do not leak internal URLs or fetch details to the client.
		throw error(500, 'Could not load swim data');
	}
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing regressed**

Run: `npm test`
Expected: PASS — existing `swimGate.test.js` and new `families.test.js` all green. (No `$env` mocking needed; the API delegates auth to the unit-tested seam.)

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/swim-data/+server.js
git commit -m "feat: authenticate swim-data API per family"
```

---

### Task 4: Add the dynamic `[family]` gated page

**Files:**
- Create: `src/routes/swim-tracker/[family]/+page.js`
- Create: `src/routes/swim-tracker/[family]/+page.svelte`

- [ ] **Step 1: Disable prerender for the dynamic route**

Create `src/routes/swim-tracker/[family]/+page.js`:

```js
// Params are not enumerable at build time; override global prerender = true.
export const prerender = false;
```

- [ ] **Step 2: Create the page component**

Create `src/routes/swim-tracker/[family]/+page.svelte`:

```svelte
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';

	$: family = $page.params.family;
	$: storageKey = `swim-family-pw:${family}`;

	let password = '';
	let unlocked = false;
	let loading = false;
	let error = null;

	let meets = [];
	let races = [];
	let swimmerEmojis = {};

	async function loadData(pw) {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/swim-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ family, password: pw })
			});
			if (res.status === 401) throw new Error('Incorrect password. Please try again.');
			if (!res.ok) throw new Error('Could not load swim data. Please try again later.');

			const data = await res.json();
			meets = data.meets;
			races = data.races;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			unlocked = true;
			sessionStorage.setItem(storageKey, pw);
		} catch (err) {
			error = err.message;
			unlocked = false;
			sessionStorage.removeItem(storageKey);
		} finally {
			loading = false;
		}
	}

	function handleSubmit() {
		if (password) loadData(password);
	}

	onMount(() => {
		const saved = sessionStorage.getItem(storageKey);
		if (saved) {
			password = saved;
			loadData(saved);
		}
	});
</script>

<svelte:head>
	<title>Family Swim Results</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Family Swim Results</h1>
		<p>Private results. Enter the family password to view.</p>
	</div>

	{#if !unlocked}
		<form class="gate" on:submit|preventDefault={handleSubmit}>
			<label for="pw">Password</label>
			<input id="pw" type="password" bind:value={password} autocomplete="current-password" disabled={loading} />
			<button type="submit" disabled={loading || !password}>{loading ? 'Unlocking…' : 'Unlock'}</button>
			{#if error}<p class="error">{error}</p>{/if}
		</form>
	{:else}
		<SwimDashboard {meets} {races} {swimmerEmojis} />
	{/if}
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
	.gate {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 320px;
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}
	.gate label { font-weight: 600; color: #2c3e50; }
	.gate input {
		padding: 0.6rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}
	.gate button {
		padding: 0.6rem;
		border: none;
		border-radius: 4px;
		background: #3498db;
		color: white;
		font-size: 1rem;
		cursor: pointer;
	}
	.gate button:disabled { opacity: 0.6; cursor: not-allowed; }
	.error { color: #c00; margin: 0; }
</style>
```

- [ ] **Step 3: Manually verify the page loads and gates**

Set a local env for testing. Create/append `.env` (gitignored) with a fictional family pointing at any reachable CSV (or your own Sheets for a real check):

```
SWIM_RIVERSIDE_PASSWORD=test-pass-phrase
SWIM_RIVERSIDE_MEETS_URL=<a published CSV url>
SWIM_RIVERSIDE_RACES_URL=<a published CSV url>
SWIM_RIVERSIDE_SWIMMERS_URL=<a published CSV url>
```

Run: `npm run dev`
Then in a browser:
- Visit `http://localhost:5173/swim-tracker/riverside` → expect the password gate.
- Enter a wrong password → expect "Incorrect password. Please try again."
- Enter `test-pass-phrase` → expect the `SwimDashboard` to render.
- Visit `http://localhost:5173/swim-tracker/nope` → expect the gate, and any password returns "Incorrect password" (no enumeration).

Confirm `git status` does NOT show `.env` as tracked (it must be gitignored). If `.env` is not ignored, stop and add it to `.gitignore` before continuing.

- [ ] **Step 4: Commit (code only — never the .env)**

```bash
git add src/routes/swim-tracker/[family]/+page.js src/routes/swim-tracker/[family]/+page.svelte
git diff --cached   # confirm no secrets/real names staged
git commit -m "feat: add dynamic per-family gated swim page"
```

---

### Task 5: Redirect the legacy `/swim-tracker/family` URL

**Files:**
- Create: `src/routes/swim-tracker/family/+page.server.js`
- Replace contents: `src/routes/swim-tracker/family/+page.svelte`

- [ ] **Step 1: Add the server redirect**

Create `src/routes/swim-tracker/family/+page.server.js`:

```js
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Depends on runtime env; override global prerender = true.
export const prerender = false;

export function load() {
	// Owner's own family is just another slug. Redirect old bookmarks to it,
	// falling back to the public demo if OWNER_SLUG isn't configured.
	const owner = env.OWNER_SLUG;
	throw redirect(308, owner ? `/swim-tracker/${owner}` : '/swim-tracker');
}
```

- [ ] **Step 2: Reduce the old page to a never-rendered placeholder**

Replace the ENTIRE contents of `src/routes/swim-tracker/family/+page.svelte` with:

```svelte
<!-- This page never renders: +page.server.js always redirects. -->
<p>Redirecting…</p>
```

- [ ] **Step 3: Manually verify the redirect**

Add `OWNER_SLUG=riverside` to your local `.env`, then:

Run: `npm run dev`
- Visit `http://localhost:5173/swim-tracker/family` → expect a redirect to `/swim-tracker/riverside`.
- Temporarily remove `OWNER_SLUG`, restart dev, revisit `/swim-tracker/family` → expect a redirect to `/swim-tracker` (demo).

- [ ] **Step 4: Commit**

```bash
git add src/routes/swim-tracker/family/+page.server.js src/routes/swim-tracker/family/+page.svelte
git commit -m "feat: redirect legacy family swim URL to owner slug"
```

---

### Task 6: Update `.env.example` to the prefixed per-family scheme

**Files:**
- Modify: `.env.example` (entire file)

- [ ] **Step 1: Replace the file contents**

Overwrite `.env.example` with (fictional `riverside` only):

```
# Server-side swim tracker config for the gated /swim-tracker/<family> pages.
# These are read by the /api/swim-data serverless function and are NEVER shipped
# to the browser (note: no VITE_ prefix). Set the same values in your Vercel
# project settings for production.
#
# MULTI-FAMILY: each family is defined by a set of env vars prefixed with
# SWIM_<SLUG>_, where <SLUG> is the family's friendly URL slug in UPPERCASE.
# The slug must be lowercase alphanumeric in the URL (e.g. /swim-tracker/riverside).
# A family becomes "live" as soon as its SWIM_<SLUG>_PASSWORD is set.
# Add more families by repeating this block with a different slug.
# Do NOT use real family names in this file — it is committed to a public repo.
#
# To get the CSV URLs:
# 1. Open the family's Google Sheet
# 2. File > Share > Publish to web
# 3. Select the sheet tab and CSV format, then Publish and copy the URL

# --- Example family: slug "riverside" ---
SWIM_RIVERSIDE_PASSWORD=change-me-to-a-strong-passphrase
SWIM_RIVERSIDE_MEETS_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=MEETS_GID&single=true&output=csv
SWIM_RIVERSIDE_RACES_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=RACES_GID&single=true&output=csv
# Optional: a "Swimmers" tab with "Name" and "Emoji" columns. Swimmers not
# listed fall back to a default emoji.
SWIM_RIVERSIDE_SWIMMERS_URL=https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=SWIMMERS_GID&single=true&output=csv

# Your own family's slug. The legacy /swim-tracker/family URL redirects here.
OWNER_SLUG=riverside
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: document multi-family env var scheme in .env.example"
```

---

### Task 7: Full verification and production migration checklist

**Files:** none (verification + ops).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — `swimGate.test.js` and `families.test.js` green.

- [ ] **Step 2: Production build smoke test**

Run: `npm run build`
Expected: build succeeds. Confirm there is NO prerender error for `/swim-tracker/[family]`, `/swim-tracker/family`, or `/api/swim-data` (all set `prerender = false`).

- [ ] **Step 3: Migrate your own family in Vercel (safe ordering — do not skip order)**

1. In Vercel project settings, ADD the new prefixed vars pointing at your EXISTING Sheets:
   - `SWIM_<OWN>_PASSWORD` (your current `SWIM_PASSWORD` value)
   - `SWIM_<OWN>_MEETS_URL` (your current `MEETS_CSV_URL`)
   - `SWIM_<OWN>_RACES_URL` (your current `RACES_CSV_URL`)
   - `SWIM_<OWN>_SWIMMERS_URL` (your current `SWIMMERS_CSV_URL`)
   - `OWNER_SLUG` = `<own>`
   (Old `SWIM_PASSWORD` / `*_CSV_URL` vars stay in place for now.)
2. Deploy the new code.
3. Verify `https://<site>/swim-tracker/<own>` unlocks with your password, and `https://<site>/swim-tracker/family` redirects to it.
4. Once confirmed, DELETE the old `SWIM_PASSWORD`, `MEETS_CSV_URL`, `RACES_CSV_URL`, `SWIMMERS_CSV_URL` vars.

- [ ] **Step 4: Add the gifted family (runbook)**

1. Copy your Google Sheet template → their 3 tabs (Meets / Races / Swimmers).
2. Publish each tab as CSV; capture the 3 URLs.
3. In Vercel, set `SWIM_<SLUG>_PASSWORD`, `SWIM_<SLUG>_MEETS_URL`, `SWIM_<SLUG>_RACES_URL`, `SWIM_<SLUG>_SWIMMERS_URL`.
4. Load their meet results into the Sheet (manually, or by pointing `swim-results-import` at a gitignored `config.<slug>.local.md`).
5. Redeploy if needed (env var changes require a redeploy to take effect), then share `https://<site>/swim-tracker/<slug>` + the password privately.

- [ ] **Step 5: Final privacy sweep**

Run: `git log --oneline origin/main..HEAD` and `git diff origin/main..HEAD`
Confirm no real family names, passwords, or Sheet CSV URLs appear anywhere in the diff or messages. If anything real slipped in, do not push — scrub history first.

---

## Notes / Out of Scope

- No database, per-person login, self-serve entry, or write UI (YAGNI). The `loadFamilyData` seam keeps a future Supabase migration localized to one function.
- Native multi-family support in the `swim-results-import` skill is a **separate follow-up spec**. Day one, the second Sheet is maintained by hand or via a swapped gitignored per-family config.
