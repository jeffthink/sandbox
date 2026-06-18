# Shared Family Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors unlock a family's swim results by typing the family slug + password in one centered form (reachable from the demo's lock icon), with the slug pre-filled when present in the URL, and the URL updating to `/swim-tracker/<slug>` on a typed unlock.

**Architecture:** Extract the gate into a shared `FamilyGate.svelte` component (form + auth fetch + dashboard-on-success + per-family session/reset). The `[family]` route and the repurposed `/swim-tracker/family` route become thin wrappers passing an `initialFamily` prop. `families.js` and `/api/swim-data` are unchanged.

**Tech Stack:** SvelteKit v2 (`$app/environment`, `$app/stores`, `$app/navigation` shallow `replaceState`), Vitest (backend only).

---

## Privacy Rule (applies to EVERY task)

Per `CLAUDE.md` → "Privacy: Never Commit PII", this repo is public. Use only the fictional `riverside` in any example. Real slugs/passwords/URLs live in env/`.env` (gitignored). Run `git diff --cached` before each commit.

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `src/lib/components/swim-tracker/FamilyGate.svelte` | Shared gate: centered form (family+password), auth fetch, dashboard-on-success, session/reset, URL reflection | **Create** |
| `src/routes/swim-tracker/[family]/+page.svelte` | Slug-from-URL wrapper; renders `<FamilyGate initialFamily={slug} />` | Modify (replace inline gate) |
| `src/routes/swim-tracker/family/+page.server.js` | `load()` returns `{ ownerSlug }` from env (was a redirect) | Modify (replace redirect) |
| `src/routes/swim-tracker/family/+page.svelte` | Generic gate wrapper; renders `<FamilyGate initialFamily={data.ownerSlug} />` | Modify (replace placeholder) |
| `src/routes/swim-tracker/+page.svelte` | Demo; lock already links to `/swim-tracker/family` | **No change** |
| `src/lib/server/families.js`, `src/routes/api/swim-data/+server.js` | Backend | **No change** |

Note: the `.container`/`.header` styles are duplicated in the two route wrappers, matching the existing per-route convention (the demo page has its own copy too). Not extracted — YAGNI.

---

### Task 1: Create the shared `FamilyGate.svelte` component

**Files:**
- Create: `src/lib/components/swim-tracker/FamilyGate.svelte`

- [ ] **Step 1: Create the component**

Create `src/lib/components/swim-tracker/FamilyGate.svelte` with exactly:

```svelte
<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import SwimDashboard from './SwimDashboard.svelte';

	export let initialFamily = '';

	let currentFamily;
	let family = initialFamily;
	let password = '';
	let unlocked = false;
	let loading = false;
	let error = null;

	let meets = [];
	let races = [];
	let swimmerEmojis = {};

	// Reset and attempt auto-unlock whenever the incoming family changes.
	// Guarded with `browser` because sessionStorage is unavailable during SSR.
	$: if (browser && initialFamily !== currentFamily) {
		currentFamily = initialFamily;
		family = initialFamily;
		password = '';
		unlocked = false;
		error = null;
		meets = [];
		races = [];
		swimmerEmojis = {};
		if (initialFamily) {
			const saved = sessionStorage.getItem(`swim-family-pw:${initialFamily}`);
			if (saved) {
				password = saved;
				loadData(saved, initialFamily);
			}
		}
	}

	async function loadData(pw, fam) {
		const slug = (fam ?? family).trim().toLowerCase();
		if (!slug || !pw) return;
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/swim-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ family: slug, password: pw })
			});
			if (res.status === 401) throw new Error('Incorrect family or password. Please try again.');
			if (!res.ok) throw new Error('Could not load swim data. Please try again later.');

			const data = await res.json();
			meets = data.meets;
			races = data.races;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			unlocked = true;
			sessionStorage.setItem(`swim-family-pw:${slug}`, pw);
			// Reflect the family in the URL if we're not already there (shallow
			// routing — updates the address bar without a remount or refetch).
			if (browser && $page.url.pathname !== `/swim-tracker/${slug}`) {
				replaceState(`/swim-tracker/${slug}`, {});
			}
		} catch (err) {
			error = err.message;
			unlocked = false;
			sessionStorage.removeItem(`swim-family-pw:${slug}`);
		} finally {
			loading = false;
		}
	}

	function handleSubmit() {
		loadData(password, family);
	}
</script>

{#if unlocked}
	<SwimDashboard {meets} {races} {swimmerEmojis} />
{:else}
	<form class="gate" on:submit|preventDefault={handleSubmit}>
		<label for="fam">Family</label>
		<input
			id="fam"
			type="text"
			bind:value={family}
			autocomplete="off"
			autocapitalize="none"
			autocorrect="off"
			spellcheck="false"
			disabled={loading}
			placeholder="family name"
		/>
		<label for="pw">Password</label>
		<input
			id="pw"
			type="password"
			bind:value={password}
			autocomplete="current-password"
			disabled={loading}
		/>
		<button type="submit" disabled={loading || !family || !password}>
			{loading ? 'Unlocking…' : 'Unlock'}
		</button>
		{#if error}<p class="error">{error}</p>{/if}
	</form>
{/if}

<style>
	.gate {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 320px;
		margin: 0 auto;
		text-align: left;
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build SUCCEEDS (the component isn't imported by a route yet, but Svelte still compiles changed files; this confirms no syntax error). Paste the success tail.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/swim-tracker/FamilyGate.svelte
git diff --cached   # confirm no PII
git commit -m "feat: add shared FamilyGate component (family + password, centered)"
```

---

### Task 2: Refactor the `[family]` route to use `FamilyGate`

**Files:**
- Modify: `src/routes/swim-tracker/[family]/+page.svelte` (entire file)

- [ ] **Step 1: Replace the file contents**

Overwrite `src/routes/swim-tracker/[family]/+page.svelte` with:

```svelte
<script>
	import { page } from '$app/stores';
	import FamilyGate from '$lib/components/swim-tracker/FamilyGate.svelte';

	$: family = $page.params.family;
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

	<FamilyGate initialFamily={family} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
</style>
```

(Do NOT change `src/routes/swim-tracker/[family]/+page.js` — it keeps `export const prerender = false;`.)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: SUCCESS, no prerender error for `/swim-tracker/[family]`. Paste success tail.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/swim-tracker/[family]/+page.svelte"
git commit -m "refactor: use FamilyGate in the dynamic family route"
```

---

### Task 3: Repurpose `/swim-tracker/family` from redirect to generic gate

**Files:**
- Modify: `src/routes/swim-tracker/family/+page.server.js` (entire file)
- Modify: `src/routes/swim-tracker/family/+page.svelte` (entire file)

- [ ] **Step 1: Replace the server load (drop the redirect)**

Overwrite `src/routes/swim-tracker/family/+page.server.js` with:

```js
import { env } from '$env/dynamic/private';

// Reads runtime env to pre-fill the gate; override global prerender = true.
export const prerender = false;

export function load() {
	// OWNER_SLUG, when set, pre-fills the generic gate's family field.
	return { ownerSlug: env.OWNER_SLUG ?? '' };
}
```

- [ ] **Step 2: Replace the page (placeholder → generic gate)**

Overwrite `src/routes/swim-tracker/family/+page.svelte` with:

```svelte
<script>
	import FamilyGate from '$lib/components/swim-tracker/FamilyGate.svelte';

	export let data;
</script>

<svelte:head>
	<title>Family Swim Results</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Family Swim Results</h1>
		<p>Private results. Enter your family name and password to view.</p>
	</div>

	<FamilyGate initialFamily={data.ownerSlug} />
</div>

<style>
	.container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
	@media (max-width: 768px) { .container { padding: 1rem; } }
	.header { margin-bottom: 2rem; }
	.header h1 { color: #2c3e50; margin-bottom: 0.5rem; }
	.header p { color: #7f8c8d; }
</style>
```

- [ ] **Step 3: Verify build + backend tests**

Run: `npm run build`
Expected: SUCCESS, no prerender error for `/swim-tracker/family`.

Run: `npm test`
Expected: 41 tests pass (backend unchanged — confirms no regression).

- [ ] **Step 4: Commit**

```bash
git add src/routes/swim-tracker/family/+page.server.js src/routes/swim-tracker/family/+page.svelte
git diff --cached   # confirm no PII
git commit -m "feat: make /swim-tracker/family a generic gate prefilled from OWNER_SLUG"
```

---

### Task 4: Full verification + dev-server walk

**Files:** none (verification).

- [ ] **Step 1: Production build + tests**

Run: `npm run build && npm test`
Expected: build succeeds; 41 tests pass.

- [ ] **Step 2: Dev-server walk** (requires a working local `.env` with at least one family, e.g. `SWIM_RIVERSIDE_PASSWORD` + `SWIM_RIVERSIDE_MEETS_URL` + `SWIM_RIVERSIDE_RACES_URL`, and optionally `OWNER_SLUG`). Restart dev so env loads: `npm run dev`.

Confirm each:
- `/swim-tracker` → click the lock icon → lands on `/swim-tracker/family`; the form is **centered**; the Family field is empty if `OWNER_SLUG` unset, pre-filled if set.
- Type a valid family + correct password → dashboard renders; the address bar changes to `/swim-tracker/<slug>`; refresh keeps it unlocked (session auto-unlock).
- Enter a wrong family or wrong password → error reads "Incorrect family or password. Please try again."
- Visit `/swim-tracker/<slug>` directly → centered gate with the Family field pre-filled to that slug; auto-unlocks if a session password exists.

- [ ] **Step 3: Privacy sweep**

Run: `git diff main..HEAD`
Confirm no real family names, passwords, or Sheet URLs anywhere in the diff. (Fictional `riverside` only.)

---

## Notes / Out of Scope

- No changes to `families.js`, `/api/swim-data`, or the env scheme.
- Slug normalization is only `trim().toLowerCase()`; invalid input yields the uniform 401 ("Incorrect family or password").
- The legacy `/swim-tracker/family` → `OWNER_SLUG` redirect is intentionally removed; `OWNER_SLUG` now pre-fills the generic gate.
