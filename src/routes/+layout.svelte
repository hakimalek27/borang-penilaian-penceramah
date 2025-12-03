<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children: Snippet;
	}
	
	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Borang Penilaian Kuliah - Masjid Al-Muttaqin</title>
	<meta name="theme-color" content="#1a5f2a" />
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(html) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		font-size: 16px;
		line-height: 1.5;
		color: #333;
		background-color: #f5f5f5;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(body) {
		min-height: 100vh;
		min-height: 100dvh;
	}

	:global(a) {
		color: #1a5f2a;
		text-decoration: none;
	}

	:global(a:hover) {
		text-decoration: underline;
	}

	:global(button) {
		cursor: pointer;
		font-family: inherit;
	}

	:global(input, textarea, select) {
		font-family: inherit;
		font-size: inherit;
	}

	/* Mobile-first responsive utilities */
	:global(.container) {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Form section styling */
	:global(.section) {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	:global(.section-title) {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a5f2a;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e5e5;
	}

	/* Alert messages */
	:global(.alert) {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	:global(.alert-success) {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	:global(.alert-error) {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	:global(.alert-info) {
		background-color: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
	}

	/* Smooth scrolling */
	:global(html) {
		scroll-behavior: smooth;
	}

	/* Touch-friendly tap targets */
	@media (pointer: coarse) {
		:global(button, a, input, select, textarea) {
			min-height: 44px;
		}
	}
</style>
