<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import FamilySlider from '$lib/components/FamilySlider.svelte';
	import EmbedWrapper from '$lib/components/EmbedWrapper.svelte';
	
	// Embed mode is passed as data from the load function
	export let data;
	$: ({ isEmbedMode } = data);
	let familySize = 4;
	let svgElement;
	let svg;
	let updateHeight;
	
	// Configuration constants - using reactive statements to avoid circular references
	$: CONFIG = {
		member: {
			radius: 20,
			circleRadius: 80,
			padding: 20
		},
		relationships: {
			textOffsetX: 50,
			textBaselineOffset: 8
		},
		transitions: {
			duration: 500,
			textDuration: 400
		}
	};
	
	// Emoji faces categorized by emotion
	const FACE_EMOJIS = {
		happy: ["😊", "😄", "😃", "😁", "🙂", "😌"],
		neutral: ["😐", "😑", "🙄", "😒"],
		sad: ["😔", "😞", "😟", "😕", "😢"]
	};
	
	// Relationship symbols
	const RELATIONSHIP_SYMBOLS = {
		positive: ["♥", "💕", "💖", "💗"],
		negative: ["💥", "⚡", "💢", "🔥"]
	};
	
	let relationshipDisplay = "6 relationships";
	
	// Function to get random emoji from category
	function getRandomEmoji(category) {
		const emojis = FACE_EMOJIS[category];
		return emojis[Math.floor(Math.random() * emojis.length)];
	}
	
	// Function to get random relationship symbol
	function getRandomRelationshipSymbol() {
		const isPositive = Math.random() > 0.3; // 70% positive, 30% negative
		const category = isPositive ? 'positive' : 'negative';
		const symbols = RELATIONSHIP_SYMBOLS[category];
		return {
			symbol: symbols[Math.floor(Math.random() * symbols.length)],
			type: category
		};
	}
	
	// Function to assign random emotions to family members
	function assignEmotions(count) {
		const emotions = [];
		for (let i = 0; i < count; i++) {
			const rand = Math.random();
			let emotion;
			if (rand < 0.5) emotion = 'happy';
			else if (rand < 0.8) emotion = 'neutral';
			else emotion = 'sad';
			emotions.push({
				emotion: emotion,
				emoji: getRandomEmoji(emotion)
			});
		}
		return emotions;
	}
	
	
	// Reactive statement to initialize when SVG element becomes available
	$: if (svgElement && !svg) {
		setupVisualization();
		updateQuadraticVisualization();
	}
	
	function setupVisualization() {
		if (!svgElement) return;
		
		// Clear any existing SVG content
		d3.select(svgElement).selectAll("*").remove();
		
		svg = d3.select(svgElement)
			.attr("preserveAspectRatio", "xMidYMid meet");
		
		// Create defs for filters
		const defs = svg.append("defs");
		const filter = defs.append("filter")
			.attr("id", "dropshadow")
			.attr("x", "-20%")
			.attr("y", "-20%")
			.attr("width", "140%")
			.attr("height", "140%");
		
		filter.append("feDropShadow")
			.attr("dx", "1")
			.attr("dy", "2")
			.attr("stdDeviation", "2")
			.attr("flood-color", "rgba(0,0,0,0.1)");
		
		// Create layer groups to ensure proper z-order
		svg.append("g").attr("class", "connections-layer");
		svg.append("g").attr("class", "symbols-layer");
		svg.append("g").attr("class", "members-layer");
		svg.append("g").attr("class", "text-layer");
	}
	
	// Calculate positions for family members
	function calculateMemberPositions(n, centerX, centerY) {
		if (n === 1) {
			return [{x: centerX, y: centerY}];
		}
		
		const positions = [];
		const angleStep = (2 * Math.PI) / n;
		
		for (let i = 0; i < n; i++) {
			const angle = i * angleStep - Math.PI / 2; // Start from top
			const x = centerX + CONFIG.member.circleRadius * Math.cos(angle);
			const y = centerY + CONFIG.member.circleRadius * Math.sin(angle);
			positions.push({x, y});
		}
		
		return positions;
	}
	
	// Generate all possible connections between family members
	function generateConnections(positions) {
		const connections = [];
		
		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const midX = (positions[i].x + positions[j].x) / 2;
				const midY = (positions[i].y + positions[j].y) / 2;
				const relationship = getRandomRelationshipSymbol();
				
				connections.push({
					source: positions[i],
					target: positions[j],
					midX,
					midY,
					symbol: relationship.symbol,
					type: relationship.type
				});
			}
		}
		
		return connections;
	}
	
	function updateQuadraticVisualization() {
		if (!svg) return;
		
		const relationshipCount = familySize * (familySize - 1) / 2;
		
		// Calculate dynamic dimensions based on content - no extra space for text since it's below the SVG
		const width = (2 * CONFIG.member.circleRadius) + (2 * CONFIG.member.padding);
		const height = (2 * CONFIG.member.circleRadius) + (2 * CONFIG.member.padding);
		
		// Center the circle in the SVG
		const centerX = width / 2;
		const centerY = height / 2;
		
		const positions = calculateMemberPositions(familySize, centerX, centerY);
		const memberEmotions = assignEmotions(familySize);
		const connections = generateConnections(positions);
		
		// Update SVG dimensions based on content
		svg.attr("width", width)
			.attr("height", height)
			.attr("viewBox", `0 0 ${width} ${height}`);
		
		// Add emotion data to positions
		positions.forEach((pos, i) => {
			pos.emotion = memberEmotions[i];
		});
		
		// Update connections
		const connectionLines = svg.select(".connections-layer").selectAll(".connection-line")
			.data(connections);
		
		// EXIT: Remove extra connections
		connectionLines.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new connections
		connectionLines.enter()
			.append("line")
			.attr("class", "connection-line")
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y)
			.style("opacity", 0)
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0.7);
		
		// UPDATE: Update existing connections
		connectionLines
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);
		
		// Update relationship symbols on connections
		const relationshipSymbols = svg.select(".symbols-layer").selectAll(".relationship-symbol")
			.data(connections);
		
		relationshipSymbols.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		relationshipSymbols.enter()
			.append("text")
			.attr("class", d => `relationship-symbol ${d.type}-relationship`)
			.attr("x", d => d.midX)
			.attr("y", d => d.midY)
			.text(d => d.symbol)
			.style("opacity", 0)
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 1);
		
		relationshipSymbols
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("x", d => d.midX)
			.attr("y", d => d.midY)
			.text(d => d.symbol)
			.attr("class", d => `relationship-symbol ${d.type}-relationship`);
		
		// Update family members
		const members = svg.select(".members-layer").selectAll(".family-member")
			.data(positions);
		
		// EXIT: Remove extra members
		members.exit()
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 0)
			.remove();
		
		// ENTER: Create new members
		const memberEnter = members.enter()
			.append("g")
			.attr("class", "family-member")
			.attr("transform", d => `translate(${d.x}, ${d.y})`)
			.style("opacity", 0);
		
		memberEnter.append("text")
			.attr("class", "member-face")
			.text(d => d.emotion.emoji)
			.style("filter", "url(#dropshadow)");
		
		memberEnter
			.transition()
			.duration(CONFIG.transitions.duration)
			.style("opacity", 1);
		
		// UPDATE: Update existing members
		members
			.transition()
			.duration(CONFIG.transitions.duration)
			.attr("transform", d => `translate(${d.x}, ${d.y})`);
		
		// Update member faces with new emotions
		members.select(".member-face")
			.text(d => d.emotion.emoji);
		
		// Update relationship count display
		updateRelationshipDisplay(relationshipCount);
		
		// Notify parent of height change for responsive iframe
		if (updateHeight) {
			updateHeight();
		}
	}
	
	function updateRelationshipDisplay(count) {
		relationshipDisplay = `${count} relationship${count !== 1 ? 's' : ''}`;
	}
	
	function handleSliderChange(event) {
		familySize = event.detail;
		if (svg) {
			updateQuadraticVisualization();
		}
	}
</script>

<svelte:head>
	<title>Quadratic Growth: Family Relationships</title>
</svelte:head>

<style>
	.section-title {
		font-size: 20px;
		font-weight: bold;
		color: #1f2937;
		margin-bottom: 15px;
		text-align: center;
	}
	
	.visualization-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}
	
	.relationship-display {
		text-align: center;
		margin-top: 0;
	}
	
	.relationship-count {
		font-size: 28px;
		font-weight: bold;
		color: #10b981;
	}
	
	:global(.connection-line) {
		stroke: #10b981;
		stroke-width: 2;
		opacity: 0.7;
	}
	
	:global(.family-member) {
		cursor: pointer;
	}
	
	:global(.member-face) {
		font-size: 24px;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	
	:global(.relationship-symbol) {
		font-size: 14px;
		text-anchor: middle;
		dominant-baseline: middle;
	}
	
	:global(.positive-relationship) {
		fill: #ef4444;
	}
	
	:global(.negative-relationship) {
		fill: #f59e0b;
	}
	
	@media (max-width: 768px) {
		.section-title {
			font-size: 18px;
		}
		
		.relationship-count {
			font-size: 24px;
		}
	}
</style>

<EmbedWrapper {isEmbedMode} bind:updateHeight>
	{#if !isEmbedMode}
		<h1 style="text-align: center; color: #1f2937; margin-bottom: 10px;">
			Family Relationships Interactive Calculator
		</h1>
		
		<div class="section-title">Quadratic Growth: Family Relationships</div>
	{/if}
	
	<FamilySlider bind:familySize on:change={handleSliderChange} />
	
	<div class="visualization-container">
		<svg bind:this={svgElement}></svg>
	</div>
	
	<div class="relationship-display">
		<div class="relationship-count">{relationshipDisplay}</div>
	</div>
</EmbedWrapper>