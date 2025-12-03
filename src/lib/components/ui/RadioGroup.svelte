<script lang="ts">
	interface Option {
		value: string | number | boolean;
		label: string;
	}

	interface Props {
		name: string;
		options: Option[];
		value?: string | number | boolean | null;
		label?: string;
		required?: boolean;
		error?: string;
		inline?: boolean;
	}

	let { 
		name, 
		options, 
		value = $bindable(null), 
		label,
		required = false,
		error,
		inline = false
	}: Props = $props();

	function handleChange(optionValue: string | number | boolean) {
		value = optionValue;
	}
</script>

<div class="radio-group" class:has-error={error}>
	{#if label}
		<span class="group-label">
			{label}
			{#if required}<span class="required">*</span>{/if}
		</span>
	{/if}
	<div class="options" class:inline>
		{#each options as option}
			<label class="radio-option">
				<input 
					type="radio" 
					{name}
					value={option.value}
					checked={value === option.value}
					onchange={() => handleChange(option.value)}
				/>
				<span class="radio-label">{option.label}</span>
			</label>
		{/each}
	</div>
	{#if error}
		<span class="error-message">{error}</span>
	{/if}
</div>

<style>
	.radio-group {
		margin-bottom: 1rem;
	}

	.group-label {
		display: block;
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #dc3545;
		margin-left: 0.25rem;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.options.inline {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		min-height: 44px;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: background-color 0.2s ease;
	}

	.radio-option:hover {
		background-color: #f5f5f5;
	}

	input[type="radio"] {
		width: 20px;
		height: 20px;
		accent-color: #1a5f2a;
		cursor: pointer;
	}

	.radio-label {
		font-size: 1rem;
		color: #333;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}
</style>
