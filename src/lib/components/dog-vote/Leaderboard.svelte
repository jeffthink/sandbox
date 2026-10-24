<script>
	import GuessChips from './GuessChips.svelte';
	import { normalizeName } from '../../dogVote/normalize.js';

	/**
	 * @type {{
	 *   leaderboard: Array<{ name: string, score: number, rank: number, guesses: Array<{ breed: string, pct: number }>, comment: string, timestamp: string }>,
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   myName?: string
	 * }}
	 */
	let { leaderboard, lookup, myName = '' } = $props();

	const MEDALS = ['🥇', '🥈', '🥉'];
	const me = $derived(normalizeName(myName));
</script>

{#if leaderboard.length === 0}
	<p class="empty">Nobody guessed this time!</p>
{:else}
	<ol class="board">
		{#each leaderboard as v (v.name)}
			<li class="entry" class:me={me !== '' && normalizeName(v.name) === me}>
				<div class="line">
					<span class="rank">{MEDALS[v.rank - 1] ?? `#${v.rank}`}</span>
					<strong class="name">{v.name}</strong>
					<span class="score">{v.score.toFixed(1)}</span>
				</div>
				<GuessChips guesses={v.guesses} {lookup} />
				{#if v.comment}<p class="comment">“{v.comment}”</p>{/if}
			</li>
		{/each}
	</ol>
{/if}

<style>
	.board {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.entry {
		display: grid;
		gap: 0.45rem;
		padding: 0.8rem 1rem;
		border-radius: 16px;
		background: var(--card);
		box-shadow: 0 2px 10px rgba(120, 72, 32, 0.08);
	}

	.entry.me {
		box-shadow: 0 0 0 3px var(--accent);
	}

	.line {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.rank {
		flex: none;
		min-width: 2.2rem;
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.name {
		flex: 1;
		overflow-wrap: anywhere;
	}

	.score {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.comment {
		margin: 0;
		color: var(--ink-soft);
		font-style: italic;
		overflow-wrap: anywhere;
	}

	.empty {
		color: var(--ink-soft);
		text-align: center;
	}
</style>
