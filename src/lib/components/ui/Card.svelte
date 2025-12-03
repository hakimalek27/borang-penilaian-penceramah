<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		clickable?: boolean;
		expanded?: boolean;
		onclick?: () => void;
		children: Snippet;
		header?: Snippet;
	}

	let { 
		title, 
		clickable = false, 
		expanded = false,
		onclick,
		children,
		header
	}: Props = $props();
</script>

<div 
	class="card" 
	class:clickable 
	class:expanded
	onclick={clickable ? onclick : undefined}
	onkeydown={clickable ? (e) => e.key === 'Enter' && onclick?.() : undefined}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
>
	{#if header}
		<div class="card-header">
			{@render header()}
		</div>
	{:else if title}
		<div class="card-header">
			<h3 class="card-title">{title}</h3>
		</div>
	{/if}
	<div class="card-body">
		{@render children()}
	</div>
</div>

<style>
	.card {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.card.clickable {
		cursor: pointer;
		transition: box-shadow 0.2s ease, transform 0.2s ease;
	}

	.card.clickable:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.card.clickable:focus {
		outline: 2px solid #1a5f2a;
		outline-offset: 2px;
	}

	.card-header {
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	.card-title {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
	}

	.card-body {
		padding: 1rem;
	}
</style>
