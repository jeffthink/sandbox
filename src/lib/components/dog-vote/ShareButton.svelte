<script>
	/** @type {{ url: string }} */
	let { url } = $props();

	/** @type {'idle' | 'copied' | 'failed'} */
	let status = $state('idle');
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			status = 'copied';
		} catch {
			status = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), 2500);
	}
</script>

<div class="share">
	<button class="btn btn-ghost" onclick={copy}>
		{status === 'copied' ? '✅ Link copied!' : '🔗 Share with friends'}
	</button>
	<p class="hint" aria-live="polite">
		{#if status === 'failed'}
			Couldn’t copy. Here’s the link: <span class="url">{url}</span>
		{:else}
			Copies a link so others can make their own guess.
		{/if}
	</p>
</div>

<style>
	.share {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.4rem;
		justify-items: start;
	}

	button {
		min-height: 44px;
		font-size: 1rem;
		padding: 0.5rem 1.1rem;
	}

	.hint {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.url {
		overflow-wrap: anywhere;
		user-select: all;
	}
</style>
