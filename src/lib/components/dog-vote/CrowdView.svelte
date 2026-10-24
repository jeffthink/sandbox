<script>
	import GuessCard from './GuessCard.svelte';
	import ConsensusChart from './ConsensusChart.svelte';
	import CrowdList from './CrowdList.svelte';

	/**
	 * @type {{
	 *   settings: { dogName: string, photos: string[] },
	 *   mine: { name: string, guesses: Array<{ breed: string, pct: number }>, comment: string },
	 *   crowd: { count: number, voted: boolean, consensus?: Array<{ breed: string, pct: number, other?: boolean }>, votes?: Array<any> } | null,
	 *   crowdError: string,
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   onedit: () => void
	 * }}
	 */
	let { settings, mine, crowd, crowdError, lookup, onedit } = $props();
</script>

<div class="wrap">
	<header class="head">
		{#if settings.photos[0]}
			<img class="thumb" src={settings.photos[0]} alt="" />
		{/if}
		<div>
			<p class="kicker">Thanks for guessing!</p>
			<h1>Here's what everyone thinks about {settings.dogName}</h1>
		</div>
	</header>

	<GuessCard guess={mine} {lookup} {onedit} />

	<section class="card crowd">
		<h2>The crowd’s average guess</h2>
		{#if crowd?.consensus}
			<p class="sub">
				Based on {crowd.count}
				{crowd.count === 1 ? 'guess' : 'guesses'}. ★ marks breeds you picked.
			</p>
			<ConsensusChart items={crowd.consensus} {lookup} highlight={mine.guesses.map((g) => g.breed)} />
		{:else if crowdError}
			<p class="sub">{crowdError}</p>
		{:else}
			<p class="sub">Loading…</p>
		{/if}
	</section>

	{#if crowd?.votes}
		<section class="everyone">
			<h2>Everyone’s guesses</h2>
			<CrowdList votes={crowd.votes} {lookup} myName={mine.name} />
		</section>
	{/if}
</div>

<style>
	.wrap {
		display: grid;
		gap: 1rem;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding-top: 1.25rem;
	}

	.thumb {
		flex: none;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 0 0 3px #fff, var(--shadow);
	}

	.kicker {
		margin: 0 0 0.2rem;
		color: var(--accent-dark);
		font-weight: 800;
		font-size: 0.9rem;
	}

	h1 {
		font-size: 1.5rem;
	}

	h2 {
		font-size: 1.3rem;
	}

	.crowd {
		display: grid;
		gap: 0.6rem;
	}

	.sub {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	.everyone {
		display: grid;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
