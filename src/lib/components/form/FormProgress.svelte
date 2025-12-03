<script lang="ts">
	import { ProgressBar } from '$lib/components/ui';
	import { getProgressStatus } from '$lib/utils/progress';

	interface Props {
		progress: number;
	}

	let { progress }: Props = $props();

	const status = $derived(getProgressStatus(progress));
	const isComplete = $derived(progress === 100);
</script>

<div class="form-progress" class:complete={isComplete}>
	<div class="progress-header">
		<span class="progress-title">Kemajuan Borang</span>
		<span class="progress-status" class:complete={isComplete}>
			{status}
		</span>
	</div>
	<ProgressBar {progress} size="md" />
	{#if isComplete}
		<p class="complete-message">
			✓ Borang sedia untuk dihantar
		</p>
	{/if}
</div>

<style>
	.form-progress {
		background: white;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		margin-bottom: 1.5rem;
		border: 2px solid transparent;
		transition: border-color 0.3s ease;
	}

	.form-progress.complete {
		border-color: #1a5f2a;
		background: linear-gradient(135deg, #f0f7f1 0%, #ffffff 100%);
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.progress-title {
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	.progress-status {
		font-size: 0.85rem;
		color: #666;
		font-weight: 500;
	}

	.progress-status.complete {
		color: #1a5f2a;
		font-weight: 600;
	}

	.complete-message {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		color: #1a5f2a;
		font-weight: 500;
		text-align: center;
	}
</style>
