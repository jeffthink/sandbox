<script>
	import PhotoHero from './PhotoHero.svelte';
	import { PRONOUNS } from './lookup.js';

	/** @type {{ settings: { dogName: string, pronoun: 'he'|'she'|'they', intro: string, photos: string[] }, count: number, onstart: () => void }} */
	let { settings, count, onstart } = $props();

	const p = $derived(PRONOUNS[settings.pronoun]);
</script>

<PhotoHero photos={settings.photos} alt="Photo of {settings.dogName}" />

<div class="wrap">
	<div class="card intro">
		<p class="kicker">🧬 DNA results are on the way</p>
		<h1>What's in {settings.dogName}?</h1>
		{#if settings.intro}
			<p class="blurb own">{settings.intro}</p>
		{/if}
		<p class="blurb">
			Guess {p.poss} breed mix before the test comes back. Once you've guessed, you'll see what
			everyone else thinks.
		</p>
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

	h1 {
		font-size: clamp(2rem, 9vw, 2.6rem);
		margin-bottom: 0.75rem;
	}

	.blurb {
		margin: 0 0 0.75rem;
		color: var(--ink-soft);
	}

	.own {
		white-space: pre-line;
	}

	.start {
		width: 100%;
		margin-top: 0.5rem;
	}

	.count {
		margin: 0.9rem 0 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
	}
</style>
