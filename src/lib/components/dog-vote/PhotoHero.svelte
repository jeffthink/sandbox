<script>
	/** @type {{ photos: string[], alt: string }} */
	let { photos, alt } = $props();

	let current = $state(0);
	/** @type {HTMLDivElement | undefined} */
	let strip = $state();

	function onscroll() {
		if (!strip) return;
		current = Math.round(strip.scrollLeft / strip.clientWidth);
	}

	/** @param {number} i */
	function go(i) {
		strip?.scrollTo({ left: i * strip.clientWidth, behavior: 'smooth' });
	}
</script>

{#if photos.length > 0}
	<div class="hero">
		<div class="strip" bind:this={strip} {onscroll}>
			{#each photos as src, i (src)}
				<img {src} alt={i === 0 ? alt : `${alt} (photo ${i + 1})`} loading={i === 0 ? 'eager' : 'lazy'} />
			{/each}
		</div>
		{#if photos.length > 1}
			<div class="dots">
				{#each photos as src, i (src)}
					<button
						class:on={i === current}
						aria-label="Show photo {i + 1}"
						aria-current={i === current}
						onclick={() => go(i)}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="placeholder" aria-hidden="true">🐶</div>
{/if}

<style>
	.hero {
		position: relative;
		max-width: 720px;
		margin: 0 auto;
	}

	.strip {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		border-radius: 0 0 32px 32px;
	}

	.strip::-webkit-scrollbar {
		display: none;
	}

	img {
		flex: 0 0 100%;
		width: 100%;
		height: min(62vh, 560px);
		object-fit: cover;
		scroll-snap-align: center;
		display: block;
	}

	.dots {
		position: absolute;
		bottom: 14px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		gap: 4px;
	}

	.dots button {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		background: transparent;
		display: grid;
		place-items: center;
		cursor: pointer;
	}

	.dots button::after {
		content: '';
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.6);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}

	.dots button.on::after {
		background: #fff;
		width: 12px;
		height: 12px;
	}

	.placeholder {
		height: 220px;
		display: grid;
		place-items: center;
		font-size: 96px;
		background: var(--accent-soft);
		border-radius: 0 0 32px 32px;
	}
</style>
