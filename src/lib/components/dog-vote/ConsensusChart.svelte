<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { groupStyle } from './groups.js';

	const OTHER_COLOR = '#b8ada0';
	const ROW = 46;
	const BAR = 14;
	const VALUE_W = 48;

	/**
	 * @type {{
	 *   items: Array<{ breed: string, pct: number, other?: boolean }>,
	 *   lookup: (name: string) => { breed: string, group: string, imageUrl: string },
	 *   highlight?: string[]
	 * }}
	 */
	let { items, lookup, highlight = [] } = $props();

	/** @type {SVGSVGElement | undefined} */
	let svg = $state();
	let width = $state(320);
	let drawn = false;

	const highlighted = $derived(new Set(highlight.map((h) => h.toLowerCase())));

	onMount(() => {
		const ro = new ResizeObserver(([entry]) => (width = Math.max(240, entry.contentRect.width)));
		if (svg?.parentElement) ro.observe(svg.parentElement);
		return () => ro.disconnect();
	});

	$effect(() => {
		if (!svg) return;
		draw(items, width, highlighted);
	});

	/**
	 * @param {typeof items} data
	 * @param {number} w
	 * @param {Set<string>} mine
	 */
	function draw(data, w, mine) {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const max = d3.max(data, (d) => d.pct) ?? 100;
		const x = d3.scaleLinear().domain([0, max]).range([0, w - VALUE_W]);
		const root = d3.select(svg).attr('width', w).attr('height', data.length * ROW);

		const rows = root
			.selectAll('g.row')
			.data(data, (d) => /** @type {any} */ (d).breed)
			.join((enter) => {
				const g = enter.append('g').attr('class', 'row');
				g.append('rect').attr('class', 'track');
				g.append('rect').attr('class', 'bar');
				g.append('text').attr('class', 'label');
				g.append('text').attr('class', 'value');
				g.append('title');
				return g;
			})
			.attr('transform', (_, i) => `translate(0, ${i * ROW})`);

		rows.select('title').text((d) => `${d.breed}: ${d.pct.toFixed(1)}% on average`);
		rows
			.select('.label')
			.attr('x', 0)
			.attr('y', 16)
			.text((d) => `${d.other ? '' : groupStyle(lookup(d.breed).group).emoji + ' '}${d.breed}${mine.has(d.breed.toLowerCase()) ? ' ★' : ''}`);
		rows
			.select('.track')
			.attr('x', 0)
			.attr('y', 24)
			.attr('height', BAR)
			.attr('rx', 4)
			.attr('width', w - VALUE_W);

		const bars = rows
			.select('.bar')
			.attr('x', 0)
			.attr('y', 24)
			.attr('height', BAR)
			.attr('rx', 4)
			.attr('fill', (d) => (d.other ? OTHER_COLOR : groupStyle(lookup(d.breed).group).color));
		const target = (/** @type {any} */ d) => Math.max(4, x(d.pct));
		if (!drawn && !reduce) {
			bars
				.attr('width', 0)
				.transition()
				.duration(700)
				.delay((_, i) => i * 70)
				.ease(d3.easeCubicOut)
				.attr('width', target);
		} else {
			bars.transition().duration(reduce ? 0 : 300).attr('width', target);
		}

		rows
			.select('.value')
			.attr('x', w)
			.attr('y', 36)
			.attr('text-anchor', 'end')
			.text((d) => `${Math.round(d.pct)}%`);
		drawn = true;
	}
</script>

<div class="chart">
	<svg bind:this={svg} role="img" aria-label="Average guess per breed across everyone">
		<desc>
			{items.map((d) => `${d.breed} ${Math.round(d.pct)}%`).join(', ')}
		</desc>
	</svg>
</div>

<style>
	.chart {
		width: 100%;
	}

	svg {
		display: block;
		overflow: visible;
	}

	.chart :global(.label) {
		font-size: 15px;
		font-weight: 700;
		fill: var(--ink);
	}

	.chart :global(.value) {
		font-family: var(--font-display);
		font-size: 17px;
		font-weight: 600;
		fill: var(--ink);
		font-variant-numeric: tabular-nums;
	}

	.chart :global(.track) {
		fill: #f6ebdf;
	}
</style>
