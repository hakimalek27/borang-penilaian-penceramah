<script lang="ts">
	import type { LecturerAlert } from '$lib/utils/alerts';
	import { getAlertSeverity, formatAlertMessage } from '$lib/utils/alerts';

	interface Props {
		alerts: LecturerAlert[];
		maxDisplay?: number;
	}

	let { alerts, maxDisplay = 5 }: Props = $props();

	const displayAlerts = $derived(alerts.slice(0, maxDisplay));
	const hasMore = $derived(alerts.length > maxDisplay);
</script>

{#if alerts.length > 0}
	<div class="alert-container">
		<div class="alert-header">
			<span class="alert-icon">⚠️</span>
			<h3>Amaran Skor Rendah</h3>
			<span class="alert-count">{alerts.length}</span>
		</div>

		<ul class="alert-list">
			{#each displayAlerts as alert}
				{@const severity = getAlertSeverity(alert.averageScore)}
				<li class="alert-item {severity}">
					<div class="alert-content">
						<span class="lecturer-name">{alert.lecturerName}</span>
						<div class="alert-details">
							<span class="score">{alert.averageScore.toFixed(2)}/4.00</span>
							<span class="count">{alert.evaluationCount} penilaian</span>
						</div>
					</div>
					<a href="/admin/laporan?lecturer={alert.lecturerId}" class="view-link">
						Lihat →
					</a>
				</li>
			{/each}
		</ul>

		{#if hasMore}
			<div class="more-alerts">
				<a href="/admin/laporan">Lihat semua {alerts.length} amaran</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.alert-container {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.alert-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.alert-icon {
		font-size: 1.25rem;
	}

	.alert-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #991b1b;
		margin: 0;
		flex: 1;
	}

	.alert-count {
		background: #dc2626;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}

	.alert-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.alert-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: white;
		padding: 0.75rem;
		border-radius: 0.375rem;
		border-left: 3px solid #f87171;
	}

	.alert-item.critical {
		border-left-color: #dc2626;
		background: #fef2f2;
	}

	.alert-item.warning {
		border-left-color: #f59e0b;
		background: #fffbeb;
	}

	.alert-content {
		flex: 1;
	}

	.lecturer-name {
		font-weight: 500;
		color: #1f2937;
		display: block;
		margin-bottom: 0.25rem;
	}

	.alert-details {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.score {
		font-weight: 600;
		color: #dc2626;
	}

	.view-link {
		font-size: 0.75rem;
		color: #3b82f6;
		text-decoration: none;
	}

	.view-link:hover {
		text-decoration: underline;
	}

	.more-alerts {
		margin-top: 0.75rem;
		text-align: center;
	}

	.more-alerts a {
		font-size: 0.75rem;
		color: #991b1b;
		text-decoration: none;
	}

	.more-alerts a:hover {
		text-decoration: underline;
	}
</style>
