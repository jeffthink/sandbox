<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { groupStyle } from './groups.js';
	import { wisdomPanelUrl } from './wisdomPanel.js';

	/**
	 * Bottom sheet (centered card on wide screens) with a bigger photo of one
	 * breed or result group. Closes on ✕, backdrop tap, Escape or swipe down.
	 * @type {{
	 *   name: string,
	 *   info: { breed: string, group: string, imageUrl: string, credit?: string, creditUrl?: string },
	 *   onclose: () => void
	 * }}
	 */
	let { name, info, onclose } = $props();

	const isGroup = $derived(/\bgroup$/i.test(name.trim()));
	const style = $derived(groupStyle(isGroup ? name : info.group));
	const link = $derived(wisdomPanelUrl(name));
	let failed = $state(false);

	/** @type {HTMLButtonElement | undefined} */
	let closeButton = $state();
	let dragY = $state(0);
	let startY = 0;

	onMount(() => {
		const opener = /** @type {HTMLElement | null} */ (document.activeElement);
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeButton?.focus();
		return () => {
			document.body.style.overflow = previous;
			opener?.focus?.();
		};
	});

	/** @param {KeyboardEvent} e */
	function onkeydown(e) {
		if (e.key === 'Escape') onclose();
	}

	/** @param {TouchEvent} e */
	function ontouchstart(e) {
		startY = e.touches[0].clientY;
	}

	/** @param {TouchEvent} e */
	function ontouchmove(e) {
		dragY = Math.max(0, e.touches[0].clientY - startY);
	}

	function ontouchend() {
		if (dragY > 80) onclose();
		dragY = 0;
	}
</script>

<svelte:window {onkeydown} />

<div class="backdrop" role="presentation" onclick={onclose} transition:fade={{ duration: 150 }}></div>
<div
	class="sheet"
	role="dialog"
	aria-modal="true"
	aria-label={name}
	style:transform={dragY ? `translateY(${dragY}px)` : null}
	{ontouchstart}
	{ontouchmove}
	{ontouchend}
	transition:fly={{ y: 300, duration: 220 }}
>
	<div class="grabber" aria-hidden="true"></div>
	<button class="close" bind:this={closeButton} onclick={onclose} aria-label="Close">✕</button>

	<div class="photo" style:--c={style.color}>
		{#if info.imageUrl && !failed}
			<img src={info.imageUrl} alt="Photo of a {name}" onerror={() => (failed = true)} />
		{:else}
			<span class="emoji" aria-hidden="true">{style.emoji}</span>
		{/if}
	</div>

	<h2>{name}</h2>
	{#if !isGroup && style.label}
		<p class="group" style:--c={style.color}>{style.emoji} {style.label}</p>
	{/if}

	{#if info.credit && info.imageUrl && !failed}
		<p class="credit">
			Photo:
			{#if info.creditUrl}
				<a href={info.creditUrl} target="_blank" rel="noopener noreferrer">{info.credit}</a>
			{:else}
				{info.credit}
			{/if}
		</p>
	{/if}

	{#if link}
		<a class="btn btn-ghost more" href={link} target="_blank" rel="noopener noreferrer">
			Learn more on Wisdom Panel ↗
		</a>
	{/if}
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(40, 24, 12, 0.45);
	}

	.sheet {
		position: fixed;
		z-index: 61;
		left: 0;
		right: 0;
		bottom: 0;
		max-height: 92vh;
		overflow-y: auto;
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		padding: 0.5rem 16px max(1.25rem, env(safe-area-inset-bottom));
		background: var(--card);
		border-radius: 20px 20px 0 0;
		box-shadow: 0 -8px 30px rgba(40, 24, 12, 0.2);
		text-align: center;
	}

	@media (min-width: 640px) {
		.sheet {
			left: 50%;
			right: auto;
			bottom: auto;
			top: 50%;
			width: min(480px, calc(100vw - 32px));
			translate: -50% -50%;
			border-radius: 20px;
			padding-top: 1rem;
		}

		.grabber {
			display: none;
		}
	}

	.grabber {
		width: 40px;
		height: 5px;
		border-radius: 3px;
		background: var(--accent-soft);
	}

	.close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: none;
		font-size: 1.2rem;
		color: var(--ink-soft);
		cursor: pointer;
	}

	.photo {
		width: min(100%, 420px);
		aspect-ratio: 4 / 3;
		margin-top: 2rem;
		border-radius: 16px;
		overflow: hidden;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--c) 15%, #fbf3ea);
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.emoji {
		font-size: 5rem;
	}

	h2 {
		margin: 0.4rem 0 0;
		font-size: 1.5rem;
	}

	.group {
		margin: 0;
		font-weight: 700;
		color: var(--ink-soft);
	}

	.credit {
		margin: 0;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}

	.credit a {
		color: var(--accent-dark);
	}

	.more {
		margin-top: 0.5rem;
		min-height: 44px;
		font-size: 1rem;
		padding: 0.5rem 1.1rem;
		text-decoration: none;
	}
</style>
