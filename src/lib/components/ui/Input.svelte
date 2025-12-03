<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		required?: boolean;
	}

	let { 
		label, 
		error, 
		required = false,
		id,
		value = $bindable(),
		...rest 
	}: Props = $props();

	const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
</script>

<div class="input-group" class:has-error={error}>
	{#if label}
		<label for={inputId}>
			{label}
			{#if required}<span class="required">*</span>{/if}
		</label>
	{/if}
	<input 
		id={inputId}
		bind:value
		class:error={error}
		{...rest}
	/>
	{#if error}
		<span class="error-message">{error}</span>
	{/if}
</div>

<style>
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.required {
		color: #dc3545;
		margin-left: 0.25rem;
	}

	input {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		transition: border-color 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: #1a5f2a;
		box-shadow: 0 0 0 3px rgba(26, 95, 42, 0.1);
	}

	input.error {
		border-color: #dc3545;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.8rem;
	}
</style>
