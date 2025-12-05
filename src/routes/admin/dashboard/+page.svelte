<script lang="ts">
	import type { PageData } from './$types';
	import { Card } from '$lib/components/ui';
	import { AlertBadge } from '$lib/components/admin';
	import { invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';

	let { data }: { data: PageData } = $props();
	
	let refreshInterval: ReturnType<typeof setInterval>;
	let lastUpdated = $state(new Date().toLocaleTimeString('ms-MY'));
	let isRefreshing = $state(false);

	// Auto-refresh every 30 seconds
	onMount(() => {
		refreshInterval = setInterval(async () => {
			await refreshData();
		}, 30000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function refreshData() {
		isRefreshing = true;
		await invalidateAll();
		lastUpdated = new Date().toLocaleTimeString('ms-MY');
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>Dashboard - Panel Admin</title>
</svelte:head>

<div class="dashboard">
	<div class="dashboard-header">
		<div>
			<h1>Dashboard</h1>
			<p class="subtitle">Ringkasan penilaian bulan {data.monthName} {data.year}</p>
		</div>
		<div class="refresh-info">
			<span class="last-updated">Kemaskini: {lastUpdated}</span>
			<button class="refresh-btn" onclick={refreshData} disabled={isRefreshing}>
				<span class="refresh-icon" class:spinning={isRefreshing}>🔄</span>
				{isRefreshing ? 'Memuat...' : 'Muat Semula'}
			</button>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{data.totalEvaluations}</div>
			<div class="stat-label">Jumlah Penilaian</div>
		</div>

		<div class="stat-card">
			<div class="stat-value">{data.totalLecturers}</div>
			<div class="stat-label">Penceramah</div>
		</div>

		<div class="stat-card">
			<div class="stat-value">{data.totalSessions}</div>
			<div class="stat-label">Sesi Kuliah</div>
		</div>
	</div>

	<div class="rankings">
		<div class="ranking-card">
			<h3>🏆 Penceramah Tertinggi</h3>
			{#if data.topLecturer}
				<div class="lecturer-rank">
					<span class="lecturer-name">{data.topLecturer.nama}</span>
					<span class="lecturer-score">{data.topLecturer.avgScore.toFixed(2)}</span>
				</div>
			{:else}
				<p class="no-data">Tiada data</p>
			{/if}
		</div>

		<div class="ranking-card">
			<h3>📉 Penceramah Terendah</h3>
			{#if data.lowestLecturer}
				<div class="lecturer-rank">
					<span class="lecturer-name">{data.lowestLecturer.nama}</span>
					<span class="lecturer-score">{data.lowestLecturer.avgScore.toFixed(2)}</span>
				</div>
			{:else}
				<p class="no-data">Tiada data</p>
			{/if}
		</div>
	</div>

	<!-- Alert Section -->
	{#if data.alerts && data.alerts.length > 0}
		<div class="alerts-section">
			<AlertBadge alerts={data.alerts} maxDisplay={5} />
		</div>
	{/if}

	<!-- Recent Comments Section -->
	<div class="comments-section">
		<h3>💬 Komen & Cadangan Terkini</h3>
		{#if data.recentComments && data.recentComments.length > 0}
			<div class="comments-list">
				{#each data.recentComments as comment}
					<div class="comment-card">
						<div class="comment-header">
							<span class="comment-author">{comment.nama_penilai}</span>
							<span class="comment-date">{comment.tarikh_penilaian}</span>
						</div>
						{#if comment.komen_penceramah}
							<div class="comment-item">
								<strong>💬 Komen:</strong>
								<p>{comment.komen_penceramah}</p>
							</div>
						{/if}
						{#if comment.cadangan_masjid}
							<div class="comment-item suggestion">
								<strong>📝 Cadangan:</strong>
								<p>{comment.cadangan_masjid}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<a href="/admin/komen" class="view-all-link">Lihat semua komen & cadangan →</a>
		{:else}
			<p class="no-data">Tiada komen atau cadangan untuk bulan ini</p>
		{/if}
	</div>

	<div class="quick-links">
		<h3>Pautan Pantas</h3>
		<div class="links-grid">
			<a href="/admin/penceramah" class="quick-link">
				<span class="link-icon">👤</span>
				<span>Tetapan Penceramah</span>
			</a>
			<a href="/admin/jadual" class="quick-link">
				<span class="link-icon">📅</span>
				<span>Tetapan Jadual Kuliah</span>
			</a>
			<a href="/admin/laporan" class="quick-link">
				<span class="link-icon">📈</span>
				<span>Laporan Penilaian</span>
			</a>
			<a href="/admin/komen" class="quick-link">
				<span class="link-icon">💬</span>
				<span>Komen & Cadangan</span>
			</a>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.75rem;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: #666;
	}

	.refresh-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.last-updated {
		font-size: 0.8rem;
		color: #999;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #e8f5e9;
		border-color: #1a5f2a;
	}

	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-icon {
		display: inline-block;
	}

	.refresh-icon.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1a5f2a;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
		margin-top: 0.25rem;
	}

	.rankings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.ranking-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.ranking-card h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.lecturer-rank {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.lecturer-name {
		font-weight: 500;
	}

	.lecturer-score {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a5f2a;
	}

	.no-data {
		color: #999;
		font-style: italic;
	}

	.alerts-section {
		margin-bottom: 2rem;
	}

	.quick-links {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.quick-links h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 0.5rem;
		color: #333;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.quick-link:hover {
		background: #e8f5e9;
		color: #1a5f2a;
	}

	.link-icon {
		font-size: 1.5rem;
	}

	.comments-section {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.comments-section h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.comment-card {
		background: #f9f9f9;
		border-radius: 0.5rem;
		padding: 1rem;
		border-left: 3px solid #1a5f2a;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.comment-author {
		font-weight: 600;
		color: #333;
	}

	.comment-date {
		font-size: 0.8rem;
		color: #999;
	}

	.comment-item {
		margin-top: 0.5rem;
	}

	.comment-item strong {
		font-size: 0.85rem;
		color: #555;
	}

	.comment-item p {
		margin: 0.25rem 0 0;
		font-size: 0.9rem;
		color: #333;
	}

	.comment-item.suggestion {
		background: #fff3e0;
		padding: 0.5rem;
		border-radius: 0.25rem;
		margin-top: 0.75rem;
	}

	.view-all-link {
		display: block;
		text-align: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
		color: #1a5f2a;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.view-all-link:hover {
		text-decoration: underline;
	}
</style>
