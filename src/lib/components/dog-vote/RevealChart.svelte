<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { groupStyle } from './groups.js';
	import { fitLabel } from './fitLabel.js';
	import { revealSchedule } from './revealSchedule.js';
	import BreedSheet from './BreedSheet.svelte';

	const ROW = 54;
	const BAR = 18;
	const VALUE_W = 64;
	const FADE = 250;

	/**
	 * @type {{
	 *   rows: Array<{ name: string, pct: number }>,
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   play: number
	 * }}
	 */
	let { rows, lookup, play } = $props();

	/** @type {SVGSVGElement | undefined} */
	let svg = $state();
	let width = $state(320);

	// Largest at the top, revealed top-down like a countdown.
	const sorted = $derived([...rows].sort((a, b) => b.pct - a.pct));

	/** Result row whose bigger photo is showing, if any. */
	let open = $state('');

	/** Announcer line above the chart: "In first place…" then the breed's name. */
	let lead = $state('');
	let called = $state('');
	/** @type {ReturnType<typeof setTimeout>[]} */
	let timers = [];
	const clearTimers = () => {
		timers.forEach(clearTimeout);
		timers = [];
	};

	onMount(() => {
		const ro = new ResizeObserver(([entry]) => (width = Math.max(240, entry.contentRect.width)));
		if (svg?.parentElement) ro.observe(svg.parentElement);
		return () => {
			ro.disconnect();
			clearTimers();
		};
	});

	$effect(() => {
		if (!svg) return;
		draw(sorted, width, play);
	});

	/** A result row may be a group ("Terrier group") or a breed. @param {string} name */
	function colorFor(name) {
		const asGroup = groupStyle(name);
		if (asGroup.color !== groupStyle('').color || /group$/i.test(name.trim())) return asGroup;
		return groupStyle(lookup(name).group);
	}

	/**
	 * @param {typeof sorted} data
	 * @param {number} w
	 * @param {number} _play - changes on Replay
	 */
	function draw(data, w, _play) {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const x = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d) => d.pct) ?? 100])
			.range([0, w - VALUE_W]);
		const root = d3.select(svg).attr('width', w).attr('height', data.length * ROW);
		root.selectAll('*').interrupt();
		root.selectAll('g.row').remove();

		const { steps, end } = revealSchedule(data.length, { reduce });
		const delay = (/** @type {number} */ i) => steps[i].barAt;
		const duration = (/** @type {number} */ i) => steps[i].grow;

		const DONE = '🎉 That’s the whole mix!';
		clearTimers();
		lead = reduce ? DONE : '';
		called = '';
		if (!reduce) {
			const later = (/** @type {number} */ ms, /** @type {() => void} */ fn) => timers.push(setTimeout(fn, ms));
			steps.forEach((step, i) => {
				later(step.captionAt, () => {
					lead = step.lead ?? '';
					called = '';
				});
				if (step.announce) later(step.barAt, () => (called = `${colorFor(data[i].name).emoji} ${data[i].name}`));
			});
			later(end, () => {
				lead = DONE;
				called = '';
			});
		}

		// Rows keep their place while hidden so the chart doesn't jump as they
		// arrive, and only become tappable (for a bigger photo) once shown.
		const g = root
			.selectAll('g.row')
			.data(data)
			.join('g')
			.attr('class', 'row')
			.attr('transform', (_, i) => `translate(0, ${i * ROW})`)
			.attr('role', 'button')
			.attr('aria-label', (d) => `${d.name} ${d.pct}%, show photo`)
			.attr('tabindex', reduce ? 0 : -1)
			.style('pointer-events', reduce ? null : 'none')
			.attr('opacity', reduce ? 1 : 0)
			.on('click', (_, d) => (open = d.name))
			.on('keydown', (/** @type {KeyboardEvent} */ e, d) => {
				if (e.key !== 'Enter' && e.key !== ' ') return;
				e.preventDefault();
				open = d.name;
			});
		g.transition()
			.delay((_, i) => delay(i))
			.duration(reduce ? 0 : FADE)
			.attr('opacity', 1)
			.on('start', function () {
				d3.select(this).attr('tabindex', 0).style('pointer-events', null);
			});

		g.append('title').text((d) => `${d.name}: ${d.pct}%`);
		g.append('rect').attr('class', 'track').attr('y', 26).attr('height', BAR).attr('rx', 4).attr('width', w - VALUE_W);

		g.append('text')
			.attr('class', 'label')
			.attr('y', 18)
			.each(function (d) {
				this.textContent = fitLabel(`${colorFor(d.name).emoji} ${d.name}`, w, (t) => {
					this.textContent = t;
					return this.getComputedTextLength();
				});
			});

		g.append('rect')
			.attr('class', 'bar')
			.attr('y', 26)
			.attr('height', BAR)
			.attr('rx', 4)
			.attr('fill', (d) => colorFor(d.name).color)
			.attr('width', reduce ? (d) => Math.max(4, x(d.pct)) : 0)
			.transition()
			.delay((_, i) => delay(i))
			.duration((_, i) => duration(i))
			.ease(d3.easeCubicOut)
			.attr('width', (d) => Math.max(4, x(d.pct)));

		const fmt = (/** @type {number} */ v, /** @type {number} */ target) =>
			`${Number.isInteger(target) ? Math.round(v) : v.toFixed(1)}%`;
		g.append('text')
			.attr('class', 'value')
			.attr('x', w)
			.attr('y', 42)
			.attr('text-anchor', 'end')
			.text((d) => fmt(reduce ? d.pct : 0, d.pct))
			.transition()
			.delay((_, i) => delay(i))
			.duration((_, i) => duration(i))
			.ease(d3.easeCubicOut)
			.tween('text', function (d) {
				const interp = d3.interpolateNumber(0, d.pct);
				return (t) => {
					this.textContent = fmt(interp(t), d.pct);
				};
			});
	}
</script>

<div class="chart">
	<p class="announce" aria-live="polite">
		{#key lead}<span class="lead">{lead}</span>{/key}
		{#key called}{#if called}<strong class="called">{called}!</strong>{/if}{/key}
	</p>
	<svg bind:this={svg} role="group" aria-label="Actual DNA breakdown">
		<desc>{sorted.map((d) => `${d.name} ${d.pct}%`).join(', ')}</desc>
	</svg>
	<p class="tap-hint">Tap a breed for a bigger photo.</p>
</div>

{#if open}
	<BreedSheet name={open} info={lookup(open)} onclose={() => (open = '')} />
{/if}

<style>
	.chart {
		width: 100%;
		min-width: 0;
	}

	/* Fixed height so the chart below doesn't shift as lines change. */
	.announce {
		min-height: 3.6rem;
		margin: 0 0 0.75rem;
		display: grid;
		align-content: center;
		justify-items: center;
		text-align: center;
	}

	.lead {
		color: var(--accent-dark);
		font-weight: 800;
		font-size: 1.05rem;
		animation: pop 300ms ease-out;
	}

	.called {
		font-family: var(--font-display);
		font-size: 1.35rem;
		color: var(--ink);
		animation: pop 300ms ease-out;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(4px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.lead,
		.called {
			animation: none;
		}
	}

	svg {
		display: block;
		max-width: 100%;
		overflow: visible;
	}

	.chart :global(.label) {
		font-size: 16px;
		font-weight: 800;
		fill: var(--ink);
	}

	.chart :global(.value) {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 600;
		fill: var(--ink);
		font-variant-numeric: tabular-nums;
	}

	.chart :global(.track) {
		fill: #f6ebdf;
	}

	.chart :global(g.row) {
		cursor: pointer;
		outline: none;
	}

	.chart :global(g.row:hover .track),
	.chart :global(g.row:focus-visible .track) {
		fill: var(--accent-soft);
	}

	.chart :global(g.row:focus-visible .label) {
		text-decoration: underline;
	}

	.tap-hint {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
</style>
