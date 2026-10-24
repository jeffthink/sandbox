<script>
	import { page } from '$app/stores';
</script>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		background: #f8fafc;
	}
	
	
	@media (max-width: 768px) {
		:global(body) {
			padding: 10px;
			max-width: 100%;
		}
	}
	
	.widget-container {
		background: white;
		padding: 30px;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		margin-bottom: 20px;
		text-align: center;
	}
	
	.nav-header {
		background: #f8fafc;
		padding: 1rem 0;
		margin-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.nav-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 20px;
	}
	
	.nav-link {
		color: #6b7280;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: color 0.2s ease;
	}
	
	.nav-link:hover {
		color: #3b82f6;
	}
	
	.nav-link::before {
		content: "← ";
		margin-right: 4px;
	}
</style>

{#if $page.url.pathname !== '/' && !$page.url.pathname.includes('-embed')}
	<div class="nav-header">
		<div class="nav-content">
			<a href="/" class="nav-link">Back to All Experiments</a>
		</div>
	</div>
{/if}

{#if !$page.url.pathname.includes('-embed')}
	<div class="widget-container">
		<slot />
	</div>
{:else}
	<slot />
{/if}