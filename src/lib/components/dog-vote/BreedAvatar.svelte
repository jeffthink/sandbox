<script>
	import { groupStyle } from './groups.js';

	/** @type {{ breed: string, group?: string, imageUrl?: string, size?: number }} */
	let { breed, group = '', imageUrl = '', size = 40 } = $props();

	let failed = $state(false);
	const style = $derived(groupStyle(group));
	const showImage = $derived(Boolean(imageUrl) && !failed);
</script>

<span
	class="avatar"
	style:width="{size}px"
	style:height="{size}px"
	style:--ring={style.color}
	style:font-size="{Math.round(size * 0.5)}px"
	title={group ? `${breed} · ${style.label}` : breed}
>
	{#if showImage}
		<img src={imageUrl} alt="" loading="lazy" onerror={() => (failed = true)} />
	{:else}
		<span aria-hidden="true">{style.emoji}</span>
	{/if}
</span>

<style>
	.avatar {
		flex: none;
		display: inline-grid;
		place-items: center;
		border-radius: 50%;
		overflow: hidden;
		background: color-mix(in srgb, var(--ring) 16%, white);
		box-shadow: 0 0 0 2px var(--ring);
		line-height: 1;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
