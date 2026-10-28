<script>
	import BreedAvatar from './BreedAvatar.svelte';
	import BreedSheet from './BreedSheet.svelte';

	/** @type {{ guesses: Array<{ breed: string, pct: number }>, lookup: (name: string) => { breed: string, group: string, imageUrl: string } }} */
	let { guesses, lookup } = $props();

	/** Breed whose bigger photo is showing, if any. */
	let open = $state('');
</script>

<ul class="chips">
	{#each guesses as g (g.breed)}
		{@const info = lookup(g.breed)}
		<li>
			<button type="button" class="chip" aria-label="{g.breed} {g.pct}%, show photo" onclick={() => (open = g.breed)}>
				<BreedAvatar breed={g.breed} group={info.group} imageUrl={info.imageUrl} size={24} />
				<span>{g.breed}</span>
				<strong>{g.pct}%</strong>
			</button>
		</li>
	{/each}
</ul>

{#if open}
	<BreedSheet name={open} info={lookup(open)} onclose={() => (open = '')} />
{/if}

<style>
	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.65rem 0.2rem 0.25rem;
		border: 0;
		border-radius: 999px;
		background: #fbf3ea;
		font-size: 0.92rem;
		text-align: left;
		cursor: pointer;
	}

	.chip:hover {
		background: var(--accent-soft);
	}
</style>
