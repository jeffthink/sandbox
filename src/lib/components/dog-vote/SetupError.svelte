<script>
	/** @type {{ message: string }} */
	let { message } = $props();
</script>

<div class="wrap">
	<div class="card box" role="alert">
		<div class="emoji" aria-hidden="true">🐕‍🦺</div>
		<h1>Hold your horses (dogs?)</h1>
		<p>{message}</p>
	</div>
</div>

<style>
	.box {
		margin-top: 15vh;
		text-align: center;
	}

	.emoji {
		font-size: 64px;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0.5rem 0;
	}

	p {
		color: var(--ink-soft);
		margin: 0;
		white-space: pre-line;
	}
</style>
