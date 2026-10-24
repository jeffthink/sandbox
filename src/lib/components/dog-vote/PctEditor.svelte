<script>
	import BreedAvatar from './BreedAvatar.svelte';

	/**
	 * @type {{
	 *   picks: Array<{ breed: string, pct: number }>,
	 *   pinned: Set<string>,
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   onset: (index: number, value: number) => void,
	 *   onremove: (index: number) => void
	 * }}
	 */
	let { picks, pinned, lookup, onset, onremove } = $props();

	const max = $derived(100 - (picks.length - 1));
	const total = $derived(picks.reduce((sum, p) => sum + p.pct, 0));
	const set = onset;
</script>

<ul class="rows">
	{#each picks as pick, i (pick.breed)}
		{@const info = lookup(pick.breed)}
		<li class="row">
			<div class="top">
				<BreedAvatar breed={pick.breed} group={info.group} imageUrl={info.imageUrl} size={40} />
				<span class="name">
					{pick.breed}
					{#if picks.length > 1 && pinned.has(pick.breed)}
						<span class="pin" title="You set this one, so it stays put">📌</span>
					{/if}
				</span>
				<button type="button" class="remove" aria-label="Remove {pick.breed}" onclick={() => onremove(i)}>✕</button>
			</div>
			<div class="controls">
				<button
					type="button"
					class="step"
					aria-label="Less {pick.breed}"
					disabled={picks.length === 1 || pick.pct <= 1}
					onclick={() => set(i, Math.max(1, Math.ceil(pick.pct / 5) * 5 - 5))}>−</button
				>
				<input
					type="range"
					min="1"
					{max}
					value={pick.pct}
					disabled={picks.length === 1}
					aria-label="{pick.breed} percentage"
					style:--fill="{((pick.pct - 1) / Math.max(max - 1, 1)) * 100}%"
					oninput={(e) => set(i, Number(e.currentTarget.value))}
				/>
				<button
					type="button"
					class="step"
					aria-label="More {pick.breed}"
					disabled={picks.length === 1 || pick.pct >= max}
					onclick={() => set(i, Math.floor(pick.pct / 5) * 5 + 5)}>+</button
				>
				<output class="pct">{pick.pct}%</output>
			</div>
		</li>
	{/each}
</ul>

{#if picks.length > 0}
	<div class="total" class:ok={total === 100} aria-live="polite">
		{total}% {total === 100 ? '✓' : ''}
	</div>
{/if}

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.row {
		background: #fffdfa;
		border: 2px solid var(--line);
		border-radius: 16px;
		padding: 0.6rem 0.75rem;
	}

	.top {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.name {
		flex: 1;
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.pin {
		font-size: 0.85rem;
		margin-left: 0.15rem;
	}

	.remove {
		width: 44px;
		height: 44px;
		border: none;
		background: transparent;
		color: var(--ink-muted);
		font-size: 1.1rem;
		cursor: pointer;
		border-radius: 50%;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.35rem;
	}

	.step {
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid var(--accent-soft);
		background: #fff;
		color: var(--accent-dark);
		font-size: 1.4rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
	}

	.step:disabled {
		opacity: 0.35;
		cursor: default;
	}

	input[type='range'] {
		flex: 1;
		min-width: 0;
		height: 44px;
		margin: 0;
		background: transparent;
		-webkit-appearance: none;
		appearance: none;
	}

	input[type='range']::-webkit-slider-runnable-track {
		height: 10px;
		border-radius: 5px;
		background: linear-gradient(to right, var(--accent) var(--fill), var(--line) var(--fill));
	}

	input[type='range']::-moz-range-track {
		height: 10px;
		border-radius: 5px;
		background: linear-gradient(to right, var(--accent) var(--fill), var(--line) var(--fill));
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 28px;
		height: 28px;
		margin-top: -9px;
		border-radius: 50%;
		background: #fff;
		border: 3px solid var(--accent);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		border: 3px solid var(--accent);
	}

	.pct {
		flex: none;
		width: 3.2rem;
		text-align: right;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.total {
		position: sticky;
		bottom: 12px;
		margin: 0.75rem auto 0;
		width: max-content;
		padding: 0.35rem 1rem;
		border-radius: 999px;
		background: var(--ink);
		color: #fff;
		font-weight: 800;
		box-shadow: var(--shadow);
	}

	.total.ok {
		background: var(--good);
	}
</style>
