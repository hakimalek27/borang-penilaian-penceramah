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
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(html) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		font-size: 16px;
		line-height: 1.5;
		color: #333;
		background-color: #f5f5f5;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		-webkit-tap-highlight-color: transparent;
	}

	:global(body) {
		min-height: 100vh;
		min-height: 100dvh;
		overscroll-behavior-y: contain;
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

	/* Mobile-specific improvements */
	@media (max-width: 480px) {
		:global(.container) {
			padding: 0.75rem;
		}

		:global(.section) {
			padding: 1rem;
			border-radius: 0.5rem;
			margin-bottom: 1rem;
		}

		:global(.section-title) {
			font-size: 1rem;
		}

		:global(html) {
			font-size: 15px;
		}
	}

	/* Safe area for notched devices */
	@supports (padding: max(0px)) {
		:global(.container) {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
			padding-bottom: max(1rem, env(safe-area-inset-bottom));
		}
	}

	/* Prevent text selection on buttons */
	:global(button) {
		-webkit-user-select: none;
		user-select: none;
	}

	/* Better focus states for accessibility */
	:global(:focus-visible) {
		outline: 2px solid #1a5f2a;
		outline-offset: 2px;
	}

	/* Loading state cursor */
	:global(.loading) {
		cursor: wait;
		pointer-events: none;
		opacity: 0.7;
	}
</style>
