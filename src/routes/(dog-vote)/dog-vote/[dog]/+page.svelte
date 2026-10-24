<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import Landing from '$lib/components/dog-vote/Landing.svelte';
	import GuessForm from '$lib/components/dog-vote/GuessForm.svelte';
	import SetupError from '$lib/components/dog-vote/SetupError.svelte';
	import { loadMine, saveMine } from '$lib/components/dog-vote/storage.js';
	import { PRONOUNS } from '$lib/components/dog-vote/lookup.js';

	let { data } = $props();

	/** @type {'landing' | 'form' | 'crowd'} */
	let view = $state('landing');
	/** @type {import('$lib/components/dog-vote/storage.js').MyGuess | null} */
	let mine = $state(null);
	/** @type {any} */
	let crowd = $state(null);
	let editing = $state(false);

	const settings = $derived(data.settings);
	const title = $derived(settings ? `What's in ${settings.dogName}?` : 'Guess the breed');
	const ogImage = $derived(
		settings?.photos?.[0]
			? new URL(settings.photos[0], $page.url.origin).href
			: undefined
	);

	onMount(() => {
		if (data.setupError || data.revealed) return;
		mine = loadMine(data.slug);
		if (mine) view = 'crowd';
	});

	/** @param {any} response */
	function onsubmitted(response) {
		mine = { ...response.vote, submittedAt: new Date().toISOString() };
		saveMine(data.slug, /** @type {any} */ (mine));
		crowd = response.crowd;
		editing = false;
		view = 'crowd';
		window.scrollTo({ top: 0 });
	}

	function start() {
		view = 'form';
		window.scrollTo({ top: 0 });
	}
</script>

<svelte:head>
	<title>{title}</title>
	{#if settings}
		<meta property="og:title" content={title} />
		<meta
			property="og:description"
			content="Guess {settings.dogName}'s breed mix before the DNA results come back!"
		/>
		{#if ogImage}<meta property="og:image" content={ogImage} />{/if}
		<meta name="description" content="Guess {settings.dogName}'s breed mix!" />
	{/if}
</svelte:head>

{#if data.setupError}
	<SetupError message={data.setupError} />
{:else if data.revealed}
	<div class="wrap"><p>Results are in!</p></div>
{:else if view === 'form'}
	<GuessForm
		slug={data.slug}
		dogName={settings.dogName}
		pronoun={settings.pronoun}
		breeds={data.breeds}
		initial={editing ? mine : null}
		{onsubmitted}
		oncancel={() => (view = mine ? 'crowd' : 'landing')}
		onclosed={() => invalidateAll()}
	/>
{:else if view === 'crowd'}
	<div class="wrap">
		<p>Thanks, {mine?.name}! (crowd view coming in step 9)</p>
		<button class="btn" onclick={() => ((editing = true), (view = 'form'))}>Edit my guess</button>
	</div>
{:else}
	<Landing {settings} count={data.count} onstart={start} />
{/if}
