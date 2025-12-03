<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		children: Snippet;
	}

	let { 
		variant = 'primary', 
		size = 'md', 
		loading = false, 
		children,
		disabled,
		...rest 
	}: Props = $props();
</script>

<button 
	class="btn btn-{variant} btn-{size}" 
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		border-radius: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 48px;
		min-width: 48px;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #1a5f2a, #2d8a3e);
		color: white;
		box-shadow: 0 2px 8px rgba(26, 95, 42, 0.25);
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #14491f, #1a5f2a);
		box-shadow: 0 4px 12px rgba(26, 95, 42, 0.35);
	}

	.btn-secondary {
		background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
		color: #333;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary:hover:not(:disabled) {
		background: linear-gradient(135deg, #e8e8e8, #d8d8d8);
	}

	.btn-danger {
		background: linear-gradient(135deg, #dc3545, #c82333);
		color: white;
		box-shadow: 0 2px 8px rgba(220, 53, 69, 0.25);
	}

	.btn-danger:hover:not(:disabled) {
		background: linear-gradient(135deg, #c82333, #bd2130);
	}

	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		min-height: 40px;
		border-radius: 0.5rem;
	}

	.btn-md {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}

	.btn-lg {
		padding: 1rem 2.5rem;
		font-size: 1.1rem;
		width: 100%;
		max-width: 320px;
	}

	.spinner {
		width: 1.25em;
		height: 1.25em;
		border: 2.5px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Mobile optimizations */
	@media (max-width: 480px) {
		.btn-lg {
			padding: 0.875rem 2rem;
			font-size: 1rem;
			max-width: 100%;
		}
	}
</style>
