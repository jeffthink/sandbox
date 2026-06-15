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
