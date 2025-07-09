<script>
	// No data needed for home page
</script>

<svelte:head>
	<title>HTML Scratch Pad - Experiments</title>
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
	
	.experiments {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 3rem;
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
		padding: 0.5rem 1rem;
		background-color: #3498db;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}
	
	.experiment-card a:hover {
		background-color: #2980b9;
	}
	
	.footer {
		text-align: center;
		padding-top: 2rem;
		border-top: 1px solid #ecf0f1;
		color: #95a5a6;
	}
</style>

<div class="header">
	<h1>HTML Scratch Pad</h1>
	<p>A collection of HTML experiments and interactive visualizations</p>
</div>

<div class="experiments">
	<div class="experiment-card">
		<h3>Linear Growth Calculator</h3>
		<p>Interactive family complexity calculator demonstrating linear growth patterns through airline ticket cost visualization using D3.js</p>
		<a href="/family-math/linear">View Experiment</a>
	</div>
	
	<div class="experiment-card">
		<h3>Quadratic Growth Relationships</h3>
		<p>Explore how family relationships grow quadratically with family size through an interactive D3.js visualization of emotional connections</p>
		<a href="/family-math/quadratic">View Experiment</a>
	</div>
	
	<div class="experiment-card">
		<h3>Exponential Growth Scenarios</h3>
		<p>Visualize exponential growth through family decision-making scenarios where each person can agree or disagree on decisions</p>
		<a href="/family-math/exponential">View Experiment</a>
	</div>
	
	<div class="experiment-card">
		<h3>Factorial Growth Arrangements</h3>
		<p>Understand factorial complexity through line ordering arrangements - see how family seating possibilities grow dramatically</p>
		<a href="/family-math/factorial">View Experiment</a>
	</div>
</div>

<div class="footer">
	<p>Built with SvelteKit and D3.js • <a href="https://github.com/jeffthink/html-scratch" style="color: inherit;">View Source</a></p>
</div>