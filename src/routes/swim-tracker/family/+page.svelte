<script>
	import { onMount } from 'svelte';
	import SwimDashboard from '$lib/components/swim-tracker/SwimDashboard.svelte';
	import { processSwimData } from '$lib/utils/swimData.js';

	const STORAGE_KEY = 'swim-family-pw';

	let password = '';
	let unlocked = false;
	let loading = false;
	let error = null;

	let processedData = null;
	let meets = [];
	let swimmerEmojis = {};

	async function loadData(pw) {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/swim-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: pw })
			});
			if (res.status === 401) throw new Error('Incorrect password. Please try again.');
			if (!res.ok) throw new Error('Could not load swim data. Please try again later.');

			const data = await res.json();
			meets = data.meets;
			swimmerEmojis = Object.fromEntries(
				(data.swimmers ?? []).filter((s) => s.Name && s.Emoji).map((s) => [s.Name, s.Emoji])
			);
			processedData = processSwimData(data.meets, data.races);
			unlocked = true;
			sessionStorage.setItem(STORAGE_KEY, pw);
		} catch (err) {
			error = err.message;
			unlocked = false;
			sessionStorage.removeItem(STORAGE_KEY);
		} finally {
			loading = false;
		}
	}

	function handleSubmit() {
		if (password) loadData(password);
	}

	onMount(() => {
		const saved = sessionStorage.getItem(STORAGE_KEY);
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
		<SwimDashboard {processedData} {meets} {swimmerEmojis} />
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
