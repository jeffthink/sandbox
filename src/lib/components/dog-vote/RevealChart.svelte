<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { groupStyle } from './groups.js';

	const ROW = 54;
	const BAR = 18;
	const VALUE_W = 64;
	const STAGGER = 600;
	const GROW = 900;

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

	// Largest at the top; animate smallest first so the biggest lands last.
	const sorted = $derived([...rows].sort((a, b) => b.pct - a.pct));

	onMount(() => {
		const ro = new ResizeObserver(([entry]) => (width = Math.max(240, entry.contentRect.width)));
		if (svg?.parentElement) ro.observe(svg.parentElement);
		return () => ro.disconnect();
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

		const n = data.length;
		const delay = (/** @type {number} */ i) => (reduce ? 0 : (n - 1 - i) * STAGGER);
		const duration = reduce ? 0 : GROW;

		const g = root
			.selectAll('g.row')
			.data(data)
			.join('g')
			.attr('class', 'row')
			.attr('transform', (_, i) => `translate(0, ${i * ROW})`);

		g.append('title').text((d) => `${d.name}: ${d.pct}%`);
		g.append('rect').attr('class', 'track').attr('y', 26).attr('height', BAR).attr('rx', 4).attr('width', w - VALUE_W);

		g.append('text')
			.attr('class', 'label')
			.attr('y', 18)
			.text((d) => `${colorFor(d.name).emoji} ${d.name}`)
			.attr('opacity', reduce ? 1 : 0)
			.transition()
			.delay((_, i) => delay(i))
			.duration(reduce ? 0 : 250)
			.attr('opacity', 1);

		g.append('rect')
			.attr('class', 'bar')
			.attr('y', 26)
			.attr('height', BAR)
			.attr('rx', 4)
			.attr('fill', (d) => colorFor(d.name).color)
			.attr('width', reduce ? (d) => Math.max(4, x(d.pct)) : 0)
			.transition()
			.delay((_, i) => delay(i))
			.duration(duration)
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
			.duration(duration)
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
	<svg bind:this={svg} role="img" aria-label="Actual DNA breakdown">
		<desc>{sorted.map((d) => `${d.name} ${d.pct}%`).join(', ')}</desc>
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
</style>
