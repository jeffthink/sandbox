<script>
	import GuessChips from './GuessChips.svelte';
	import { groupStyle } from './groups.js';

	/** @type {{ guess: { name: string, guesses: Array<{ breed: string, pct: number }>, comment: string }, lookup: (name: string) => { breed: string, group: string, imageUrl: string }, onedit?: () => void }} */
	let { guess, lookup, onedit } = $props();
</script>

<section class="card mine">
	<h2>Your guess</h2>
	<div class="strip" role="img" aria-label={guess.guesses.map((g) => `${g.breed} ${g.pct}%`).join(', ')}>
		{#each guess.guesses as g (g.breed)}
			<span style:flex-grow={g.pct} style:background={groupStyle(lookup(g.breed).group).color}></span>
		{/each}
	</div>
	<GuessChips guesses={guess.guesses} {lookup} />
	{#if guess.comment}
		<p class="comment">“{guess.comment}”</p>
	{/if}
	{#if onedit}
		<button class="btn btn-ghost edit" onclick={onedit}>✏️ Edit my guess</button>
	{/if}
</section>

<style>
	.mine {
		display: grid;
		gap: 0.75rem;
	}

	h2 {
		font-size: 1.3rem;
	}

	.strip {
		display: flex;
		gap: 2px;
		height: 18px;
		border-radius: 6px;
		overflow: hidden;
	}

	.strip span {
		flex-basis: 0;
		min-width: 6px;
	}

	.comment {
		margin: 0;
		color: var(--ink-soft);
		font-style: italic;
		overflow-wrap: anywhere;
	}

	.edit {
		justify-self: start;
		min-height: 44px;
		font-size: 1rem;
		padding: 0.5rem 1.1rem;
	}
</style>
