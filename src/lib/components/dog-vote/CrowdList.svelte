<script>
	import GuessChips from './GuessChips.svelte';

	/** @type {{ votes: Array<{ name: string, guesses: Array<{ breed: string, pct: number }>, comment: string, timestamp: string }>, lookup: (name: string) => { breed: string, group: string, imageUrl: string }, myName?: string }} */
	let { votes, lookup, myName = '' } = $props();

	const me = $derived(myName.trim().toLowerCase().replace(/\s+/g, ' '));
</script>

<ul class="list">
	{#each votes as v (v.name + v.timestamp)}
		<li class="item" class:me={v.name.trim().toLowerCase().replace(/\s+/g, ' ') === me}>
			<div class="who">
				<span class="initial" aria-hidden="true">{v.name.trim()[0]?.toUpperCase() ?? '?'}</span>
				<strong>{v.name}</strong>
			</div>
			<GuessChips guesses={v.guesses} {lookup} />
			{#if v.comment}
				<p class="comment">“{v.comment}”</p>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.item {
		display: grid;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		border-radius: 16px;
		background: var(--card);
		box-shadow: 0 2px 10px rgba(120, 72, 32, 0.08);
	}

	.item.me {
		box-shadow: 0 0 0 2px var(--accent);
	}

	.who {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		overflow-wrap: anywhere;
	}

	.initial {
		flex: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--accent-soft);
		color: var(--accent-dark);
		font-family: var(--font-display);
		font-weight: 600;
	}

	.comment {
		margin: 0;
		color: var(--ink-soft);
		font-style: italic;
		overflow-wrap: anywhere;
	}
</style>
