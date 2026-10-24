<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import Landing from '$lib/components/dog-vote/Landing.svelte';
	import GuessForm from '$lib/components/dog-vote/GuessForm.svelte';
	import SetupError from '$lib/components/dog-vote/SetupError.svelte';
	import CrowdView from '$lib/components/dog-vote/CrowdView.svelte';
	import RevealView from '$lib/components/dog-vote/RevealView.svelte';
	import { loadMine, saveMine, clearMine } from '$lib/components/dog-vote/storage.js';
	import { makeLookup } from '$lib/components/dog-vote/lookup.js';

	let { data } = $props();

	/** @type {'landing' | 'form' | 'crowd'} */
	let view = $state('landing');
	/** @type {import('$lib/components/dog-vote/storage.js').MyGuess | null} */
	let mine = $state(null);
	/** @type {any} */
	let crowd = $state(null);
	let editing = $state(false);
	let crowdError = $state('');

	const settings = $derived(data.settings);
	const lookup = $derived(makeLookup(data.breeds ?? []));
	const title = $derived(settings ? `${settings.dogName}'s Mystery Mix` : 'Guess the breed');
	const ogImage = $derived(
		settings?.photos?.[0]
			? new URL(settings.photos[0], $page.url.origin).href
			: undefined
	);

	onMount(() => {
		if (data.setupError) return;
		mine = loadMine(data.slug);
		if (data.revealed) return;
		if (mine) {
			view = 'crowd';
			refreshCrowd(mine.name);
		}
	});

	/** @param {string} name */
	async function refreshCrowd(name) {
		crowdError = '';
		try {
			const res = await fetch(`/api/dog-vote/${data.slug}/crowd?name=${encodeURIComponent(name)}`);
			if (!res.ok) throw new Error(String(res.status));
			const body = await res.json();
			if (!body.voted) {
				// Their vote is gone from the sheet (e.g. removed by the owner): start over.
				clearMine(data.slug);
				mine = null;
				view = 'landing';
				return;
			}
			crowd = body;
			// Same name may have re-voted from another device; show the vote that counts.
			const key = name.trim().toLowerCase().replace(/\s+/g, ' ');
			const current = body.votes.find(
				(/** @type {any} */ v) => v.name.trim().toLowerCase().replace(/\s+/g, ' ') === key
			);
			if (current && mine) {
				mine = { ...mine, name: current.name, guesses: current.guesses, comment: current.comment };
				saveMine(data.slug, mine);
			}
		} catch {
			crowdError = 'Couldn’t load the crowd right now. Pull to refresh in a bit.';
		}
	}

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
	<RevealView {settings} reveal={data.reveal} {lookup} myName={mine?.name ?? ''} />
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
	<CrowdView
		{settings}
		mine={/** @type {any} */ (mine)}
		{crowd}
		{crowdError}
		{lookup}
		onedit={() => {
			editing = true;
			view = 'form';
			window.scrollTo({ top: 0 });
		}}
	/>
{:else}
	<Landing {settings} count={data.count} onstart={start} />
{/if}
