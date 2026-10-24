<script>
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
		rel="stylesheet"
	/>
	<meta name="theme-color" content="#fff4e6" />
</svelte:head>

<div class="dogvote">
	{@render children()}
</div>

<style>
	/* `html body` outranks the sandbox layout's `body` rules, which can linger
	   in the page after a client-side navigation from the home page. */
	:global(html body) {
		margin: 0;
		padding: 0;
		max-width: none;
		background: #fff4e6;
	}

	.dogvote {
		--bg: #fff4e6;
		--card: #ffffff;
		--ink: #2b211b;
		--ink-soft: #6b5a4e;
		--ink-muted: #9a887a;
		--line: #f0dcc6;
		--accent: #e2603a;
		--accent-dark: #c24a26;
		--accent-soft: #ffe2d4;
		--good: #1f8a5b;
		--radius: 20px;
		--shadow: 0 6px 24px rgba(120, 72, 32, 0.12);
		--font-display: 'Fredoka', 'Nunito', system-ui, sans-serif;
		--font-body: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;

		min-height: 100vh;
		min-height: 100dvh;
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-body);
		font-size: 17px;
		line-height: 1.45;
		-webkit-text-size-adjust: 100%;
	}

	.dogvote :global(*),
	.dogvote :global(*::before),
	.dogvote :global(*::after) {
		box-sizing: border-box;
	}

	.dogvote :global(h1),
	.dogvote :global(h2),
	.dogvote :global(h3) {
		font-family: var(--font-display);
		font-weight: 600;
		line-height: 1.15;
		margin: 0;
	}

	.dogvote :global(button) {
		font: inherit;
		color: inherit;
	}

	.dogvote :global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 52px;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: #fff;
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--accent-dark);
		transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.15s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.dogvote :global(.btn:active) {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--accent-dark);
	}

	.dogvote :global(.btn:disabled) {
		opacity: 0.6;
		cursor: default;
	}

	.dogvote :global(.btn-ghost) {
		background: transparent;
		color: var(--accent-dark);
		box-shadow: none;
		border: 2px solid var(--accent-soft);
	}

	.dogvote :global(.btn-ghost:active) {
		transform: none;
		box-shadow: none;
		background: var(--accent-soft);
	}

	.dogvote :global(.card) {
		background: var(--card);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 1.25rem;
	}

	.dogvote :global(.wrap) {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 16px 48px;
	}

	.dogvote :global(:focus-visible) {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
</style>
