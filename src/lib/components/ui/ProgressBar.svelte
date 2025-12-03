<script lang="ts">
	interface Props {
		progress: number;
		showLabel?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { progress, showLabel = true, size = 'md' }: Props = $props();

	const clampedProgress = $derived(Math.max(0, Math.min(100, progress)));
	
	const colorClass = $derived(() => {
		if (clampedProgress < 30) return 'progress-low';
		if (clampedProgress < 60) return 'progress-medium';
		if (clampedProgress < 100) return 'progress-high';
		return 'progress-complete';
	});
</script>

<div class="progress-container {size}">
	<div class="progress-bar">
		<div 
			class="progress-fill {colorClass()}" 
			style="width: {clampedProgress}%"
			role="progressbar"
			aria-valuenow={clampedProgress}
			aria-valuemin={0}
			aria-valuemax={100}
		></div>
	</div>
	{#if showLabel}
		<span class="progress-label">{clampedProgress}%</span>
	{/if}
</div>

<style>
	.progress-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
	}

	.progress-bar {
		flex: 1;
		background: #e9ecef;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.progress-container.sm .progress-bar {
		height: 6px;
	}

	.progress-container.md .progress-bar {
		height: 10px;
	}

	.progress-container.lg .progress-bar {
		height: 16px;
	}

	.progress-fill {
		height: 100%;
		border-radius: 0.5rem;
		transition: width 0.3s ease, background-color 0.3s ease;
	}

	.progress-low {
		background: linear-gradient(90deg, #dc3545, #e74c3c);
	}

	.progress-medium {
		background: linear-gradient(90deg, #ffc107, #f39c12);
	}

	.progress-high {
		background: linear-gradient(90deg, #28a745, #2ecc71);
	}

	.progress-complete {
		background: linear-gradient(90deg, #1a5f2a, #28a745);
	}

	.progress-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #555;
		min-width: 3rem;
		text-align: right;
	}

	.progress-container.sm .progress-label {
		font-size: 0.75rem;
	}

	.progress-container.lg .progress-label {
		font-size: 1rem;
	}
</style>
