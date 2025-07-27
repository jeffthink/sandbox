<script>
	import { formatTime } from '$lib/utils/swimData.js';
	
	export let data;
	
	// Process data for summer summary
	$: swimmerStats = calculateSwimmerStats(data);
	
	function calculateSwimmerStats(swimData) {
		if (!swimData || !swimData.races) return [];
		
		const swimmers = swimData.filters?.swimmers || [];
		const races = swimData.races || [];
		
		return swimmers.map(swimmer => {
			const swimmerRaces = races.filter(race => race.Swimmer === swimmer && !race.isDQ);
			
			// Total races
			const totalRaces = swimmerRaces.length;
			
			// Different event types
			const eventTypes = [...new Set(swimmerRaces.map(race => race.eventKey))];
			const eventCount = eventTypes.length;
			
			// Calculate biggest time drop per event
			let biggestDrop = null;
			let biggestDropEvent = '';
			
			eventTypes.forEach(eventKey => {
				const eventRaces = swimmerRaces
					.filter(race => race.eventKey === eventKey && race.standardizedTimeInSeconds)
					.sort((a, b) => a.date - b.date);
				
				if (eventRaces.length >= 2) {
					const firstTime = eventRaces[0].standardizedTimeInSeconds;
					const lastTime = eventRaces[eventRaces.length - 1].standardizedTimeInSeconds;
					const timeDrop = firstTime - lastTime;
					
					if (timeDrop > 0 && (biggestDrop === null || timeDrop > biggestDrop)) {
						biggestDrop = timeDrop;
						biggestDropEvent = eventKey;
					}
				}
			});
			
			// Get stroke emojis for events
			const eventEmojis = eventTypes.map(event => ({
				name: event,
				emoji: getStrokeEmoji(event)
			}));
			
			return {
				name: swimmer,
				totalRaces,
				eventCount,
				eventTypes: eventEmojis,
				biggestDrop,
				biggestDropEvent,
				biggestDropFormatted: biggestDrop ? formatTime(biggestDrop) : null
			};
		});
	}
	
	function getStrokeEmoji(eventKey) {
		const stroke = eventKey.toLowerCase();
		if (stroke.includes('freestyle') || stroke.includes('free')) return '🏊‍♀️';
		if (stroke.includes('backstroke') || stroke.includes('back')) return '🔄';
		if (stroke.includes('breaststroke') || stroke.includes('breast')) return '🐸';
		if (stroke.includes('butterfly') || stroke.includes('fly')) return '🦋';
		if (stroke.includes('im') || stroke.includes('medley')) return '🏅';
		return '🏊‍♀️'; // default
	}
	
	function getSwimmerEmoji(swimmer) {
		const emojiMap = {
			'Eva': '🐷',
			'Maeve': '🐨',
			'Quinn': '🐱'
		};
		return emojiMap[swimmer] || '🏊‍♀️';
	}
</script>

<style>
	.container {
		padding: 1rem;
	}
	
	.header {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.header h1 {
		font-size: 2.5rem;
		background: linear-gradient(45deg, #3498db, #9b59b6, #e74c3c);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
		font-weight: bold;
	}
	
	.header p {
		font-size: 1.2rem;
		color: #7f8c8d;
		margin: 0.5rem 0 0 0;
	}
	
	.swimmers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.swimmer-card {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		border-radius: 20px;
		padding: 2rem;
		color: white;
		box-shadow: 0 10px 30px rgba(0,0,0,0.2);
		transform: translateY(0);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.swimmer-card:nth-child(2) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.swimmer-card:nth-child(3) {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.swimmer-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 40px rgba(0,0,0,0.3);
	}
	
	.swimmer-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q 25 0 50 10 T 100 10 V 20 H 0 Z" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23waves)"/></svg>') repeat;
		opacity: 0.3;
		pointer-events: none;
	}
	
	.swimmer-name {
		position: relative;
		z-index: 1;
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1.5rem;
		text-align: center;
		text-shadow: 0 2px 4px rgba(0,0,0,0.3);
	}
	
	.stat-section {
		position: relative;
		z-index: 1;
		margin-bottom: 1.5rem;
		background: rgba(255,255,255,0.95);
		padding: 1rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
		color: #333;
	}
	
	.stat-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		font-weight: 600;
	}
	
	.stat-value {
		font-size: 2.5rem;
		font-weight: bold;
		text-align: center;
		margin: 0.5rem 0;
		color: #2c3e50;
		animation: countUp 2s ease-out;
	}
	
	@keyframes countUp {
		from { 
			opacity: 0;
			transform: scale(0.5);
		}
		to { 
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.events-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	
	.event-badge {
		background: rgba(44,62,80,0.1);
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		backdrop-filter: blur(5px);
		border: 1px solid rgba(44,62,80,0.2);
		color: #2c3e50;
	}
	
	.biggest-drop {
		text-align: center;
		font-size: 1.1rem;
		line-height: 1.4;
	}
	
	.drop-time {
		font-size: 1.8rem;
		font-weight: bold;
		color: #e67e22;
		display: block;
		margin: 0.5rem 0;
	}
	
	.no-data {
		text-align: center;
		padding: 3rem;
		color: #6c757d;
		font-size: 1.1rem;
	}
	
	.pulse {
		animation: pulse 2s infinite;
	}
	
	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}
	
	@media (max-width: 768px) {
		.swimmers-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.swimmer-card {
			padding: 1.5rem;
		}
		
		.header h1 {
			font-size: 2rem;
		}
		
		.swimmer-name {
			font-size: 1.5rem;
		}
		
		.stat-value {
			font-size: 2rem;
		}
	}
</style>

<div class="container">
	<div class="header">
		<h1>🏊‍♀️ Summer Swimming Highlights 🏆</h1>
		<p>Amazing achievements from our swimmers this season!</p>
	</div>
	
	{#if swimmerStats.length > 0}
		<div class="swimmers-grid">
			{#each swimmerStats as swimmer, index}
				<div class="swimmer-card">
					<div class="swimmer-name">
						{getSwimmerEmoji(swimmer.name)} {swimmer.name}
					</div>
					
					<div class="stat-section">
						<div class="stat-header">
							🏊‍♀️ Total Races
						</div>
						<div class="stat-value pulse">
							{swimmer.totalRaces}
						</div>
					</div>
					
					<div class="stat-section">
						<div class="stat-header">
							🏆 Event Variety
						</div>
						<div class="stat-value">
							{swimmer.eventCount}
						</div>
						<div class="events-list">
							{#each swimmer.eventTypes as event}
								<div class="event-badge">
									<span>{event.emoji}</span>
									<span>{event.name}</span>
								</div>
							{/each}
						</div>
					</div>
					
					{#if swimmer.biggestDrop}
						<div class="stat-section">
							<div class="stat-header">
								⏱️ Biggest Time Drop
							</div>
							<div class="biggest-drop">
								<strong>{swimmer.biggestDropEvent}</strong>
								<span class="drop-time">{swimmer.biggestDropFormatted} seconds</span>
							</div>
						</div>
					{:else}
						<div class="stat-section">
							<div class="stat-header">
								🌟 Keep Swimming!
							</div>
							<div class="biggest-drop">
								More races needed to track improvements!
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="no-data">
			No swimmer data available yet. Start adding race results to see amazing highlights! 🏊‍♀️
		</div>
	{/if}
</div>