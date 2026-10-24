<script>
	import { PRONOUNS } from './lookup.js';

	/**
	 * @type {{
	 *   closest: { name: string, score: number } | null,
	 *   wildest: { name: string, score: number } | null,
	 *   crowdScore: number | null,
	 *   popularMiss: { breed: string, voters: number, avgPct: number } | null,
	 *   pronoun: 'he'|'she'|'they',
	 *   count: number
	 * }}
	 */
	let { closest, wildest, crowdScore, popularMiss, pronoun, count } = $props();

	const obj = $derived(PRONOUNS[pronoun].obj);
</script>

<div class="callouts">
	{#if closest}
		<div class="callout">
			<span class="icon" aria-hidden="true">🎯</span>
			<p class="label">Closest guess</p>
			<p class="value">{closest.name}</p>
			<p class="detail">{closest.score.toFixed(1)} points</p>
		</div>
	{/if}
	{#if wildest && count > 1}
		<div class="callout">
			<span class="icon" aria-hidden="true">🎢</span>
			<p class="label">Wildest guess</p>
			<p class="value">{wildest.name}</p>
			<p class="detail">{wildest.score.toFixed(1)} points</p>
		</div>
	{/if}
	{#if crowdScore !== null && count > 1}
		<div class="callout">
			<span class="icon" aria-hidden="true">👥</span>
			<p class="label">Wisdom of the crowd</p>
			<p class="value">{crowdScore.toFixed(1)} points</p>
			<p class="detail">if everyone's average were one guess</p>
		</div>
	{/if}
	{#if popularMiss}
		<div class="callout">
			<span class="icon" aria-hidden="true">🙈</span>
			<p class="label">Most popular breed that wasn't in {obj} at all</p>
			<p class="value">{popularMiss.breed}</p>
			<p class="detail">
				picked by {popularMiss.voters}
				{popularMiss.voters === 1 ? 'person' : 'people'}
			</p>
		</div>
	{/if}
</div>

<style>
	.callouts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.callout {
		background: var(--card);
		border-radius: 18px;
		padding: 0.9rem;
		box-shadow: 0 2px 10px rgba(120, 72, 32, 0.08);
	}

	.icon {
		font-size: 1.6rem;
	}

	p {
		margin: 0;
	}

	.label {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-soft);
		margin-top: 0.2rem;
	}

	.value {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.detail {
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
</style>
