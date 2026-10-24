<script>
	import PhotoHero from './PhotoHero.svelte';
	import { PRONOUNS } from './lookup.js';

	/** @type {{ settings: { dogName: string, pronoun: 'he'|'she'|'they', intro: string, photos: string[] }, count: number, notice?: string, onstart: () => void }} */
	let { settings, count, notice = '', onstart } = $props();

	const poss = $derived(PRONOUNS[settings.pronoun].poss);
</script>

<PhotoHero photos={settings.photos} alt="Photo of {settings.dogName}" />

<div class="wrap">
	<div class="card intro">
		<p class="kicker">🧬 DNA results are on the way</p>
		<h1 class="title">{settings.dogName}'s Mystery Mix</h1>
		{#if settings.intro}
			<p class="blurb own">{settings.intro}</p>
		{:else}
			<p class="blurb">
				We sent off a DNA test to find out which breeds make up {settings.dogName}. Before the
				results come back, take your best guess at {poss} mix, then see how it stacks up against
				everyone else’s.
			</p>
		{/if}
		{#if notice}
			<p class="notice" role="status">{notice}</p>
		{/if}
		<button class="btn start" onclick={onstart}>🐾 Make your guess</button>
		<p class="count">
			{#if count === 0}
				Be the first to guess!
			{:else if count === 1}
				<strong>1</strong> person has guessed so far
			{:else}
				<strong>{count}</strong> people have guessed so far
			{/if}
		</p>
	</div>
</div>

<style>
	.intro {
		margin-top: -40px;
		position: relative;
		text-align: center;
		padding: 1.5rem 1.25rem 1.25rem;
	}

	.kicker {
		margin: 0 0 0.35rem;
		color: var(--accent-dark);
		font-weight: 700;
		font-size: 0.9rem;
	}

	/* A class (not bare h1) so it outranks the layout's shared heading reset. */
	.title {
		font-size: clamp(2rem, 9vw, 2.6rem);
		margin: 0 0 1.5rem;
	}

	.blurb {
		margin: -0.75rem 0 1.5rem;
		color: var(--ink-soft);
	}

	.own {
		white-space: pre-line;
	}

	.notice {
		margin: -0.5rem 0 1rem;
		padding: 0.6rem 0.8rem;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent-dark);
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.start {
		width: 100%;
	}

	.count {
		margin: 0.9rem 0 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
</style>
