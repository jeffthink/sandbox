<script>
	import BreedPicker from './BreedPicker.svelte';
	import PctEditor from './PctEditor.svelte';
	import { evenSplit, appendRemainder, snap, totalStatus, STEP } from './balance.js';
	import { makeLookup, PRONOUNS } from './lookup.js';

	const MAX_BREEDS = 5;
	const MAX_NAME = 50;
	const MAX_COMMENT = 280;

	/**
	 * @type {{
	 *   slug: string,
	 *   dogName: string,
	 *   pronoun: 'he'|'she'|'they',
	 *   breeds: Array<{ breed: string, group: string, imageUrl: string }>,
	 *   initial?: { name: string, guesses: Array<{ breed: string, pct: number }>, comment: string } | null,
	 *   onsubmitted: (response: any) => void,
	 *   oncancel?: () => void,
	 *   onclosed: () => void
	 * }}
	 */
	let { slug, dogName, pronoun, breeds, initial = null, onsubmitted, oncancel, onclosed } = $props();

	const lookup = $derived(makeLookup(breeds));
	const editing = Boolean(initial);
	const originalName = initial?.name ?? '';

	let name = $state(initial?.name ?? '');
	let picks = $state(initial ? initial.guesses.map((g) => ({ ...g })) : []);
	let comment = $state(initial?.comment ?? '');
	/**
	 * Breeds split evenly until the visitor moves a slider. After that nothing
	 * moves on its own; they bring the total to 100 themselves.
	 */
	let adjusted = $state(Boolean(initial)); // a saved guess's values were set on purpose
	/** @type {{ name?: string, guesses?: string, comment?: string, form?: string }} */
	let errors = $state({});
	let submitting = $state(false);

	const possessive = $derived(
		PRONOUNS[pronoun].poss[0].toUpperCase() + PRONOUNS[pronoun].poss.slice(1)
	);
	const status = $derived(totalStatus(picks.map((p) => p.pct)));

	const renamed = $derived(editing && name.trim().toLowerCase() !== originalName.trim().toLowerCase());

	/** @param {string} breed */
	function pick(breed) {
		const current = picks.map((p) => p.pct);
		const pcts = adjusted ? appendRemainder(current) : evenSplit(current.length + 1);
		picks = [...picks, { breed, pct: 0 }].map((p, i) => ({ ...p, pct: pcts[i] }));
		errors.guesses = undefined;
	}

	/** @param {number} index */
	function remove(index) {
		const rest = picks.filter((_, i) => i !== index);
		if (rest.length <= 1) adjusted = false; // a lone breed is simply 100%
		const pcts = adjusted ? rest.map((p) => p.pct) : evenSplit(rest.length);
		picks = rest.map((p, i) => ({ ...p, pct: rest.length === 1 ? 100 : pcts[i] }));
	}

	/**
	 * @param {number} index
	 * @param {number} value
	 */
	function setOne(index, value) {
		const pct = snap(value, 100 - STEP * (picks.length - 1));
		adjusted = true;
		picks = picks.map((p, i) => (i === index ? { ...p, pct } : p));
	}

	/** @param {SubmitEvent} e */
	async function submit(e) {
		e.preventDefault();
		errors = {};
		if (!name.trim()) errors.name = 'Please enter your name.';
		if (picks.length === 0) errors.guesses = 'Pick at least one breed.';
		else if (!status.ok) errors.guesses = `Percentages must add up to 100 (now ${status.total}).`;
		if (Object.keys(errors).length > 0) return;

		submitting = true;
		try {
			const res = await fetch(`/api/dog-vote/${slug}/vote`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), guesses: picks, comment })
			});
			const body = await res.json().catch(() => ({}));
			if (res.ok) onsubmitted(body);
			else if (res.status === 400 && body.errors) errors = body.errors;
			else if (res.status === 409) {
				errors = { form: 'Voting just closed — see the results!' };
				setTimeout(onclosed, 1200);
			} else errors = { form: body.error ?? 'Something went wrong. Try again?' };
		} catch {
			errors = { form: 'Couldn’t reach the server. Check your connection and try again.' };
		} finally {
			submitting = false;
		}
	}
</script>

<div class="wrap">
	<header class="head">
		{#if oncancel}
			<button type="button" class="back" onclick={oncancel}>← Back</button>
		{/if}
		<h1>{editing ? 'Edit your guess' : `Guess ${dogName}'s mix`}</h1>
	</header>

	<form class="card" onsubmit={submit} novalidate>
		<section>
			<label class="label" for="guess-name">Your name</label>
			<input
				id="guess-name"
				class="text"
				bind:value={name}
				maxlength={MAX_NAME}
				autocomplete="given-name"
				autocapitalize="words"
				enterkeyhint="next"
				aria-invalid={Boolean(errors.name)}
				aria-describedby={errors.name ? 'name-error' : undefined}
			/>
			{#if renamed}
				<p class="hint">Changing your name saves this as a new person’s guess.</p>
			{/if}
			{#if errors.name}<p class="error" id="name-error">{errors.name}</p>{/if}
		</section>

		<section>
			<span class="label">Pick 1–{MAX_BREEDS} breeds</span>
			<p class="hint">Can’t find it? Type it in and add it.</p>
			<BreedPicker {breeds} picked={picks.map((p) => p.breed)} max={MAX_BREEDS} onpick={pick} />
		</section>

		{#if picks.length > 0}
			<section>
				<span class="label">How much of each?</span>
				<p class="hint">
					Set each one with the slider or −/+. Nothing moves on its own, so make them add up
					to 100%.
				</p>
				<PctEditor {picks} {lookup} onset={setOne} onremove={remove} />
			</section>
		{/if}
		{#if errors.guesses}<p class="error">{errors.guesses}</p>{/if}

		<section>
			<label class="label" for="guess-comment">
				Why do you think so? <span class="optional">(optional)</span>
			</label>
			<textarea
				id="guess-comment"
				class="text"
				bind:value={comment}
				maxlength={MAX_COMMENT}
				rows="3"
				placeholder="{possessive} ears are a dead giveaway…"
			></textarea>
			<p class="counter" class:near={comment.length > MAX_COMMENT - 20}>{comment.length}/{MAX_COMMENT}</p>
			{#if errors.comment}<p class="error">{errors.comment}</p>{/if}
		</section>

		{#if errors.form}<p class="error form-error" role="alert">{errors.form}</p>{/if}

		<button class="btn submit" type="submit" disabled={submitting || (picks.length > 0 && !status.ok)}>
			{#if submitting}
				Saving…
			{:else if picks.length > 0 && !status.ok}
				Make it add up to 100% ({status.total}% now)
			{:else}
				{editing ? 'Save my new guess' : 'Submit my guess'}
			{/if}
		</button>
	</form>
</div>

<style>
	.head {
		padding: 1.25rem 0 1rem;
	}

	.back {
		border: none;
		background: transparent;
		color: var(--accent-dark);
		font-weight: 700;
		min-height: 44px;
		padding: 0;
		cursor: pointer;
	}

	h1 {
		font-size: 1.9rem;
	}

	form {
		display: grid;
		gap: 1.4rem;
	}

	section {
		display: grid;
		gap: 0.4rem;
	}

	.label {
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
	}

	.optional {
		font-family: var(--font-body);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-muted);
	}

	.hint {
		margin: -0.2rem 0 0.2rem;
		font-size: 0.92rem;
		color: var(--ink-soft);
	}

	.text {
		width: 100%;
		min-height: 52px;
		padding: 0.75rem 1rem;
		border: 2px solid var(--line);
		border-radius: 14px;
		font: inherit;
		background: #fffdfa;
		color: var(--ink);
		resize: vertical;
	}

	.text:focus {
		border-color: var(--accent);
		outline: none;
	}

	.counter {
		margin: 0;
		text-align: right;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}

	.counter.near {
		color: var(--accent-dark);
	}

	.error {
		margin: 0;
		color: #b3261e;
		font-weight: 700;
		font-size: 0.95rem;
	}

	.form-error {
		text-align: center;
	}

	.submit {
		width: 100%;
	}
</style>
