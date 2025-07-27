<script>
	// No data needed for home page
</script>

<svelte:head>
	<title>Interactive Sandbox</title>
</svelte:head>

<style>
	.header {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.header h1 {
		color: #2c3e50;
		margin-bottom: 0.5rem;
	}
	
	.header p {
		color: #7f8c8d;
		font-size: 1.1rem;
	}
	
	.category-section {
		margin-bottom: 3rem;
	}
	
	.category-section h2 {
		color: #2c3e50;
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #ecf0f1;
	}
	
	.experiments {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.experiment-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.experiment-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0,0,0,0.15);
	}
	
	.experiment-card h3 {
		margin: 0 0 0.5rem 0;
		color: #2c3e50;
	}
	
	.experiment-card p {
		margin: 0 0 1rem 0;
		color: #7f8c8d;
	}
	
	.experiment-card a {
		display: inline-block;
		margin-top: 0.5rem;
		color: #3498db;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}
	
	.experiment-card a:hover {
		color: #2980b9;
		text-decoration: underline;
	}
	
	.footer {
		text-align: center;
		padding-top: 2rem;
		border-top: 1px solid #ecf0f1;
		color: #95a5a6;
	}
</style>

<div class="header">
	<h1>Interactive Sandbox</h1>
	<p>A collection of interactive visualizations and experiments</p>
</div>

<div class="category-section">
	<h2>Family Math</h2>
	<div class="experiments">
		<div class="experiment-card">
			<h3>Linear Growth Calculator</h3>
			<p>Interactive visualization demonstrating linear growth patterns through airline ticket cost calculations</p>
			<a href="/family-math/linear">Explore →</a>
		</div>
		
		<div class="experiment-card">
			<h3>Quadratic Growth Relationships</h3>
			<p>Explore how relationships grow quadratically with group size through an interactive network visualization</p>
			<a href="/family-math/quadratic">Explore →</a>
		</div>
		
		<div class="experiment-card">
			<h3>Exponential Growth Scenarios</h3>
			<p>Visualize exponential growth through decision-making scenarios where each participant can agree or disagree</p>
			<a href="/family-math/exponential">Explore →</a>
		</div>
		
		<div class="experiment-card">
			<h3>Factorial Growth Arrangements</h3>
			<p>Understand factorial complexity through ordering arrangements - see how possibilities grow dramatically with size</p>
			<a href="/family-math/factorial">Explore →</a>
		</div>
	</div>
</div>

<div class="category-section">
	<h2>Swim Tracker</h2>
	<div class="experiments">
		<div class="experiment-card">
			<h3>Swim Times Tracker</h3>
			<p>Track swim meet results, visualize time improvements, and monitor progress across different events and swimmers</p>
			<a href="/swim-tracker">Explore →</a>
		</div>
	</div>
</div>

<div class="footer">
	<p>Built with SvelteKit and D3.js • <a href="https://github.com/jeffthink/html-scratch" style="color: inherit;">View Source</a></p>
</div>