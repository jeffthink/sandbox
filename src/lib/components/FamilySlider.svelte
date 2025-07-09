<script>
	import { createEventDispatcher } from 'svelte';
	
	export let familySize = 4;
	export let min = 2;
	export let max = 8;
	
	const dispatch = createEventDispatcher();
	
	function handleInput(event) {
		familySize = parseInt(event.target.value);
		// Only dispatch on input for immediate UI feedback
		dispatch('input', familySize);
	}
	
	function handleChange(event) {
		familySize = parseInt(event.target.value);
		// Dispatch change when user stops dragging
		dispatch('change', familySize);
	}
</script>

<style>
	.slider-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		margin-bottom: 10px;
	}
	
	.slider-label {
		font-weight: 600;
		color: #374151;
		font-size: 16px;
	}
	
	.family-slider {
		width: 300px;
		height: 8px;
		background: #e5e7eb;
		border-radius: 4px;
		outline: none;
		cursor: pointer;
	}
	
	.family-slider::-webkit-slider-thumb {
		appearance: none;
		width: 24px;
		height: 24px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}
	
	.family-slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		background: #3b82f6;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}
	
	.family-size {
		font-size: 24px;
		font-weight: bold;
		color: #3b82f6;
		min-width: 40px;
		text-align: center;
	}
	
	.label-container {
		display: none;
	}
	
	.desktop-family-size {
		display: inline;
	}
	
	.desktop-label {
		display: inline;
	}
	
	@media (max-width: 768px) {
		.slider-container {
			flex-direction: column;
			gap: 10px;
			margin-bottom: 15px;
		}
		
		.label-container {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
		}
		
		.desktop-family-size {
			display: none;
		}
		
		.desktop-label {
			display: none;
		}
		
		.family-slider {
			width: 250px;
		}
		
		.slider-label {
			font-size: 14px;
		}
		
		.family-size {
			font-size: 18px;
		}
	}
</style>

<div class="slider-container">
	<div class="label-container">
		<label class="slider-label" for="family-slider">Family Size:</label>
		<span class="family-size">{familySize}</span>
	</div>
	<label class="slider-label desktop-label" for="family-slider">Family Size:</label>
	<input 
		type="range" 
		{min} 
		{max} 
		value={familySize} 
		class="family-slider"
		id="family-slider"
		on:input={handleInput}
		on:change={handleChange}
	>
	<span class="family-size desktop-family-size">{familySize}</span>
</div>