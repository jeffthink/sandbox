<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { invalidateAll, replaceState } from '$app/navigation';
	import Landing from '$lib/components/dog-vote/Landing.svelte';
	import GuessForm from '$lib/components/dog-vote/GuessForm.svelte';
	import SetupError from '$lib/components/dog-vote/SetupError.svelte';
	import CrowdView from '$lib/components/dog-vote/CrowdView.svelte';
	import RevealView from '$lib/components/dog-vote/RevealView.svelte';
	import { loadMine, saveMine, clearMine } from '$lib/components/dog-vote/storage.js';
	import { makeLookup } from '$lib/components/dog-vote/lookup.js';

	let { data } = $props();

	/** @type {'loading' | 'landing' | 'form' | 'crowd'} */
	let view = $state(data.urlName && !data.revealed && !data.setupError ? 'loading' : 'landing');
	/** @type {import('$lib/components/dog-vote/storage.js').MyGuess | null} */
	let mine = $state(null);
	/** @type {any} */
	let crowd = $state(null);
	let editing = $state(false);
	let crowdError = $state('');
	let notice = $state('');

	const settings = $derived(data.settings);
	const lookup = $derived(makeLookup(data.breeds ?? []));
	const title = $derived(settings ? `${settings.dogName}'s Mystery Mix` : 'Guess the breed');
	const ogImage = $derived(
		settings?.photos?.[0]
			? new URL(settings.photos[0], $page.url.origin).href
			: undefined
	);

	const basePath = $derived(`/dog-vote/${data.slug}`);

	/** A bookmarkable link straight to someone's results, e.g. /dog-vote/<dog>/Sam-Lee. */
	/** @param {string} name */
	const personalPath = (name) =>
		`${basePath}/${encodeURIComponent(name.trim().replace(/\s+/g, '-'))}`;

	onMount(() => {
		if (data.setupError) return;
		mine = loadMine(data.slug);
		if (data.revealed) return;
		if (data.urlName) {
			refreshCrowd(data.urlName, true);
		} else if (mine) {
			view = 'crowd';
			refreshCrowd(mine.name);
		}
	});

	/**
	 * @param {string} name
	 * @param {boolean} [fromUrl] - name came from the address bar, not this browser's storage
	 */
	async function refreshCrowd(name, fromUrl = false) {
		crowdError = '';
		try {
			const res = await fetch(`/api/dog-vote/${data.slug}/crowd?name=${encodeURIComponent(name)}`);
			if (!res.ok) throw new Error(String(res.status));
			const body = await res.json();
			if (!body.voted) {
				if (fromUrl) {
					notice = `We couldn’t find a guess from “${name.replace(/[-_]+/g, ' ')}”. Make one below!`;
				} else {
					// Their vote is gone from the sheet (e.g. removed by the owner): start over.
					clearMine(data.slug);
					mine = null;
				}
				view = 'landing';
				replaceState(basePath, {});
				return;
			}
			crowd = body;
			// Same name may have re-voted from another device; show the vote that counts.
			const current = body.votes.find((/** @type {any} */ v) => v.name === body.name);
			if (current) {
				const same = mine && mine.name.trim().toLowerCase() === current.name.trim().toLowerCase();
				mine = {
					submittedAt: same && mine ? mine.submittedAt : current.timestamp,
					name: current.name,
					guesses: current.guesses,
					comment: current.comment
				};
				saveMine(data.slug, mine);
				view = 'crowd';
				replaceState(personalPath(current.name), {});
			}
		} catch {
			crowdError = 'Couldn’t load the crowd right now. Pull to refresh in a bit.';
			if (view === 'loading') view = 'landing';
		}
	}

	/** @param {any} response */
	function onsubmitted(response) {
		mine = { ...response.vote, submittedAt: new Date().toISOString() };
		saveMine(data.slug, /** @type {any} */ (mine));
		crowd = response.crowd;
		editing = false;
		view = 'crowd';
		replaceState(personalPath(response.vote.name), {});
		window.scrollTo({ top: 0 });
	}

	// Forget this browser's guess (not the vote itself) so someone else can play.
	function reset() {
		clearMine(data.slug);
		mine = null;
		crowd = null;
		editing = false;
		notice = '';
		view = 'landing';
		replaceState(basePath, {});
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
	<RevealView
		{settings}
		reveal={data.reveal}
		{lookup}
		myName={data.urlName ? data.urlName.replace(/[-_]+/g, ' ') : (mine?.name ?? '')}
	/>
{:else if view === 'loading'}
	<p class="loading">Loading…</p>
{:else if view === 'form'}
	<GuessForm
		slug={data.slug}
		dogName={settings.dogName}
		pronoun={settings.pronoun}
		photos={settings.photos}
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
		shareUrl={$page.url.origin + basePath}
		myUrl={mine ? $page.url.origin + personalPath(mine.name) : ''}
		onreset={reset}
		onedit={() => {
			editing = true;
			view = 'form';
			window.scrollTo({ top: 0 });
		}}
	/>
{:else}
	<Landing {settings} count={data.count} {notice} onstart={start} />
{/if}

<style>
	.loading {
		padding: 3rem 0;
		text-align: center;
		color: var(--ink-soft);
	}
</style>
