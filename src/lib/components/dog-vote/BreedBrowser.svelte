<script>
	import { onMount } from 'svelte';
	import { groupBreeds } from './lookup.js';
	import { normalizeName } from '../../dogVote/normalize.js';

	/**
	 * Full-screen gallery of every breed, grouped, for visitors who'd rather
	 * look than search. Tap a photo to select or unselect it.
	 * @type {{
	 *   breeds: Array<{ breed: string, group: string, imageUrl: string }>,
	 *   picked: string[],
	 *   max: number,
	 *   ontoggle: (breed: string) => void,
	 *   onclose: () => void
	 * }}
	 */
	let { breeds, picked, max, ontoggle, onclose } = $props();

	const sections = $derived(groupBreeds(breeds));
	const pickedKeys = $derived(new Set(picked.map(normalizeName)));
	const full = $derived(picked.length >= max);

	/** @type {HTMLButtonElement | undefined} */
	let doneButton = $state();
	/** @type {HTMLDivElement | undefined} */
	let scroller = $state();
	/** @type {Set<string>} */
	let failed = $state(new Set());

	onMount(() => {
		// Keep the page behind from scrolling while the gallery is open.
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		doneButton?.focus();
		return () => (document.body.style.overflow = previous);
	});

	/** @param {KeyboardEvent} e */
	function onkeydown(e) {
		if (e.key === 'Escape') onclose();
	}

	/** @param {string} id */
	function jump(id) {
		const target = scroller?.querySelector(`#${id}`);
		if (!target || !scroller) return;
		const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
		scroller.scrollTo({ top: top - 8, behavior: 'smooth' });
	}

	/** @param {string} breed */
	function markFailed(breed) {
		failed = new Set([...failed, breed]);
	}
</script>

<svelte:window {onkeydown} />

<div class="overlay" role="dialog" aria-modal="true" aria-label="Browse all breeds">
	<header class="bar">
		<div class="status">
			<strong>{picked.length} of {max} picked</strong>
			{#if full}<span class="hint">Tap a ✓ to swap one out</span>{/if}
		</div>
		<button class="btn done" bind:this={doneButton} onclick={onclose}>Done</button>
	</header>

	<nav class="jump" aria-label="Breed groups">
		{#each sections as s (s.id)}
			<button type="button" style:--c={s.color} onclick={() => jump(s.id)}>{s.emoji} {s.label}</button>
		{/each}
	</nav>

	<div class="scroller" bind:this={scroller}>
		{#each sections as s (s.id)}
			<section id={s.id}>
				<h2 style:--c={s.color}>{s.emoji} {s.label}</h2>
				<ul class="grid">
					{#each s.breeds as b (b.breed)}
						{@const selected = pickedKeys.has(normalizeName(b.breed))}
						<li>
							<button
								type="button"
								class="tile"
								class:selected
								aria-pressed={selected}
								disabled={full && !selected}
								style:--c={s.color}
								onclick={() => ontoggle(b.breed)}
							>
								<span class="photo">
									{#if b.imageUrl && !failed.has(b.breed)}
										<img src={b.imageUrl} alt="" loading="lazy" onerror={() => markFailed(b.breed)} />
									{:else}
										<span class="emoji" aria-hidden="true">{s.emoji}</span>
									{/if}
									{#if selected}<span class="check" aria-hidden="true">✓</span>{/if}
								</span>
								<span class="name">{b.breed}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 16px;
		padding-top: max(0.75rem, env(safe-area-inset-top));
		background: var(--card);
		box-shadow: 0 2px 10px rgba(120, 72, 32, 0.1);
	}

	.status {
		display: grid;
	}

	.hint {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}

	.done {
		min-height: 44px;
		padding: 0.5rem 1.4rem;
		font-size: 1.05rem;
	}

	.jump {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		padding: 0.6rem 16px;
		scrollbar-width: none;
		flex: none;
	}

	.jump::-webkit-scrollbar {
		display: none;
	}

	.jump button {
		flex: none;
		min-height: 36px;
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		border: 2px solid color-mix(in srgb, var(--c) 45%, white);
		background: #fff;
		font-size: 0.9rem;
		font-weight: 700;
		white-space: nowrap;
		cursor: pointer;
	}

	.scroller {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 0 16px max(24px, env(safe-area-inset-bottom));
	}

	.scroller > section {
		max-width: 720px;
		margin: 0 auto;
	}

	h2 {
		font-size: 1.15rem;
		margin: 1rem 0 0.6rem;
		padding-left: 0.6rem;
		border-left: 4px solid var(--c);
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.tile {
		width: 100%;
		display: grid;
		gap: 0.35rem;
		padding: 0;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.tile:disabled {
		cursor: default;
		opacity: 0.4;
	}

	.photo {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		border-radius: 16px;
		overflow: hidden;
		background: color-mix(in srgb, var(--c) 16%, white);
		box-shadow: 0 2px 8px rgba(120, 72, 32, 0.12);
		transition: box-shadow 0.12s ease, transform 0.12s ease;
	}

	.tile:active:not(:disabled) .photo {
		transform: scale(0.97);
	}

	.selected .photo {
		box-shadow: 0 0 0 4px var(--accent), 0 2px 8px rgba(120, 72, 32, 0.12);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.emoji {
		font-size: 56px;
	}

	.check {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-weight: 800;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}

	.name {
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1.2;
		padding: 0 0.15rem;
	}

	.selected .name {
		color: var(--accent-dark);
	}
</style>
