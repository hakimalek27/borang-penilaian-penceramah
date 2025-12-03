<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string | number;
		label: string;
	}

	interface Props extends HTMLSelectAttributes {
		label?: string;
		options: Option[];
		placeholder?: string;
		error?: string;
		required?: boolean;
	}

	let { 
		label, 
		options, 
		placeholder = 'Pilih...',
		error, 
		required = false,
		id,
		value = $bindable(''),
		...rest 
	}: Props = $props();

	const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
</script>

<div class="select-group" class:has-error={error}>
	{#if label}
		<label for={selectId}>
			{label}
			{#if required}<span class="required">*</span>{/if}
		</label>
	{/if}
	<select 
		id={selectId}
		bind:value
		class:error={error}
		{...rest}
	>
		<option value="" disabled>{placeholder}</option>
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if error}
		<span class="error-message">{error}</span>
	{/if}
</div>

<style>
	.select-group {
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

	select {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		background-color: white;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	select:focus {
		outline: none;
		border-color: #1a5f2a;
		box-shadow: 0 0 0 3px rgba(26, 95, 42, 0.1);
	}

	select.error {
		border-color: #dc3545;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.8rem;
	}
</style>
