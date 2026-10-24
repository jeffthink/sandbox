<script>
	import RevealChart from './RevealChart.svelte';
	import Leaderboard from './Leaderboard.svelte';
	import Callouts from './Callouts.svelte';
	import { PRONOUNS } from './lookup.js';

	/**
	 * @type {{
	 *   settings: { dogName: string, pronoun: 'he'|'she'|'they', photos: string[] },
	 *   reveal: { results: Array<{ name: string, pct: number }>, leaderboard: Array<any>, closest: any, wildest: any, crowdScore: number | null, popularMiss: any },
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   myName?: string
	 * }}
	 */
	let { settings, reveal, lookup, myName = '' } = $props();

	let play = $state(0);
	const obj = $derived(PRONOUNS[settings.pronoun].obj);
</script>

<div class="wrap">
	<header class="head">
		{#if settings.photos[0]}
			<img class="hero" src={settings.photos[0]} alt="Photo of {settings.dogName}" />
		{/if}
		<p class="kicker">🧬 The DNA results are in!</p>
		<h1>Here's what's in {settings.dogName}</h1>
	</header>

	<section class="card">
		{#if reveal.results.length > 0}
			<RevealChart rows={reveal.results} {lookup} {play} />
			<button class="btn btn-ghost replay" onclick={() => (play += 1)}>↻ Replay</button>
		{:else}
			<p class="sub">Results coming any minute…</p>
		{/if}
	</section>

	{#if reveal.leaderboard.length > 0}
		<Callouts
			closest={reveal.closest}
			wildest={reveal.wildest}
			crowdScore={reveal.crowdScore}
			popularMiss={reveal.popularMiss}
			pronoun={settings.pronoun}
			count={reveal.leaderboard.length}
		/>
	{/if}

	<section class="board">
		<h2>Leaderboard</h2>
		<p class="sub">
			Score = how much of your guess overlapped what's really in {obj} (out of 100). Ties go to
			whoever guessed first.
		</p>
		<Leaderboard leaderboard={reveal.leaderboard} {lookup} {myName} />
	</section>
	<p class="closed">Voting is closed.</p>
</div>

<style>
	.wrap {
		display: grid;
		gap: 1rem;
	}

	.head {
		text-align: center;
		padding-top: 1.25rem;
	}

	.hero {
		width: 128px;
		height: 128px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 0 0 4px #fff, var(--shadow);
		margin-bottom: 0.75rem;
	}

	.kicker {
		margin: 0 0 0.2rem;
		color: var(--accent-dark);
		font-weight: 800;
	}

	h1 {
		font-size: clamp(1.8rem, 8vw, 2.4rem);
	}

	h2 {
		font-size: 1.4rem;
	}

	.sub {
		margin: 0.25rem 0 0.75rem;
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	.replay {
		margin-top: 0.5rem;
		min-height: 44px;
		font-size: 1rem;
		padding: 0.5rem 1.1rem;
	}

	.board {
		margin-top: 0.5rem;
	}

	.closed {
		text-align: center;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
</style>
