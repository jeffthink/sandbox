<script>
	import BreedAvatar from './BreedAvatar.svelte';
	import { normalizeName } from '../../dogVote/normalize.js';

	/** @type {{ breeds: Array<{ breed: string, group: string, imageUrl: string }>, picked: string[], max: number, onpick: (breed: string) => void }} */
	let { breeds, picked, max, onpick } = $props();

	let query = $state('');
	/** @type {HTMLInputElement | undefined} */
	let input = $state();

	const full = $derived(picked.length >= max);
	const pickedKeys = $derived(new Set(picked.map(normalizeName)));
	const q = $derived(normalizeName(query));
	const matches = $derived(
		q
			? breeds
					.filter((b) => !pickedKeys.has(normalizeName(b.breed)) && normalizeName(b.breed).includes(q))
					.sort((a, b) => rank(a.breed) - rank(b.breed) || a.breed.localeCompare(b.breed))
					.slice(0, 8)
			: []
	);
	const exact = $derived(breeds.some((b) => normalizeName(b.breed) === q) || pickedKeys.has(q));
	const offerCustom = $derived(q.length > 0 && !exact && query.trim().length <= 60);

	/** Prefer breeds whose name (or a word in it) starts with the query. @param {string} name */
	function rank(name) {
		const n = normalizeName(name);
		if (n.startsWith(q)) return 0;
		if (n.split(' ').some((w) => w.startsWith(q))) return 1;
		return 2;
	}

	/** @param {string} breed */
	function choose(breed) {
		onpick(breed);
		query = '';
		input?.focus();
	}

	/** @param {KeyboardEvent} e */
	function onkeydown(e) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		if (matches.length > 0) choose(matches[0].breed);
		else if (offerCustom) choose(query.trim());
	}
</script>

<div class="picker">
	<label class="visually-hidden" for="breed-search">Search breeds</label>
	<input
		id="breed-search"
		bind:this={input}
		bind:value={query}
		{onkeydown}
		type="search"
		autocomplete="off"
		autocapitalize="words"
		enterkeyhint="done"
		disabled={full}
		placeholder={full ? `${max} breeds max — remove one to swap` : 'Search breeds, e.g. husky'}
	/>

	{#if matches.length > 0 || offerCustom}
		<ul class="results" role="listbox" aria-label="Matching breeds">
			{#each matches as b (b.breed)}
				<li>
					<button type="button" onclick={() => choose(b.breed)}>
						<BreedAvatar breed={b.breed} group={b.group} imageUrl={b.imageUrl} size={36} />
						<span>{b.breed}</span>
					</button>
				</li>
			{/each}
			{#if offerCustom}
				<li>
					<button type="button" class="custom" onclick={() => choose(query.trim())}>
						<span class="plus" aria-hidden="true">＋</span>
						<span>Add “{query.trim()}”</span>
					</button>
				</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}

	input {
		width: 100%;
		min-height: 52px;
		padding: 0.75rem 1rem;
		border: 2px solid var(--line);
		border-radius: 14px;
		font: inherit;
		background: #fffdfa;
		color: var(--ink);
	}

	input:focus {
		border-color: var(--accent);
		outline: none;
	}

	input:disabled {
		background: #f6eee4;
	}

	.results {
		list-style: none;
		margin: 0.4rem 0 0;
		padding: 0.25rem;
		border-radius: 14px;
		background: var(--card);
		border: 2px solid var(--line);
	}

	.results button {
		width: 100%;
		min-height: 48px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.35rem 0.5rem;
		border: none;
		border-radius: 10px;
		background: transparent;
		text-align: left;
		cursor: pointer;
	}

	.results button:hover,
	.results button:focus-visible {
		background: var(--accent-soft);
	}

	.custom {
		color: var(--accent-dark);
		font-weight: 700;
	}

	.plus {
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		border: 2px dashed var(--accent);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
