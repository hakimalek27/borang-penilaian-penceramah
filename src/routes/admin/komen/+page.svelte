<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { Select, Button } from '$lib/components/ui';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'komen' | 'cadangan'>('komen');
	let selectedMonth = $state(data.selectedMonth);
	let selectedYear = $state(data.selectedYear);
	let deleteConfirmKomen = $state<string | null>(null);
	let deleteConfirmCadangan = $state<string | null>(null);

	const monthOptions = data.monthNames.map((name: string, i: number) => ({ value: i + 1, label: name }));
	const yearOptions = [2024, 2025, 2026, 2027, 2028].map(y => ({ value: y, label: String(y) }));

	function applyFilter() {
		goto(`/admin/komen?bulan=${selectedMonth}&tahun=${selectedYear}`);
	}

	function getKomenKey(comment: { nama_penilai: string; tarikh: string; komen: string }) {
		return `${comment.nama_penilai}-${comment.tarikh}-${comment.komen}`;
	}

	function getCadanganKey(suggestion: { nama_penilai: string; tarikh: string; cadangan: string }) {
		return `${suggestion.nama_penilai}-${suggestion.tarikh}-${suggestion.cadangan}`;
	}
</script>

<svelte:head>
	<title>Komen & Cadangan - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Komen & Cadangan</h1>
		<p class="subtitle">{data.monthName} {data.selectedYear}</p>
	</div>

	<!-- Filter -->
	<div class="filter-bar">
		<Select 
			label="Bulan" 
			options={monthOptions} 
			bind:value={selectedMonth}
			onchange={applyFilter}
		/>
		<Select 
			label="Tahun" 
			options={yearOptions} 
			bind:value={selectedYear}
			onchange={applyFilter}
		/>
	</div>

	<!-- Tabs -->
	<div class="tabs">
		<button 
			class="tab" 
			class:active={activeTab === 'komen'}
			onclick={() => activeTab = 'komen'}
		>
			💬 Komen Penceramah ({data.lecturerComments.length})
		</button>
		<button 
			class="tab" 
			class:active={activeTab === 'cadangan'}
			onclick={() => activeTab = 'cadangan'}
		>
			📝 Cadangan Masjid ({data.mosqueSuggestions.length})
		</button>
	</div>

	<!-- Content -->
	<div class="content">
		{#if activeTab === 'komen'}
			<!-- Komen Penceramah - Senarai Terus -->
			{#if data.lecturerComments.length > 0}
				<div class="comments-list">
					{#each data.lecturerComments as comment}
						{@const komenKey = getKomenKey(comment)}
						<div class="comment-item">
							<div class="comment-header">
								<div class="comment-meta">
									<span class="comment-author">{comment.nama_penilai}</span>
									<span class="comment-date">{comment.tarikh}</span>
								</div>
								{#if deleteConfirmKomen === komenKey}
									<div class="delete-confirm">
										<form method="POST" action="?/clearKomen" use:enhance={() => {
											return async ({ update }) => {
												deleteConfirmKomen = null;
												await update();
											};
										}}>
											<input type="hidden" name="nama" value={comment.nama_penilai} />
											<input type="hidden" name="tarikh" value={comment.tarikh} />
											<input type="hidden" name="komen" value={comment.komen} />
											<button type="submit" class="btn-confirm-delete">Pasti?</button>
										</form>
										<button class="btn-cancel" onclick={() => deleteConfirmKomen = null}>Batal</button>
									</div>
								{:else}
									<button class="btn-delete" onclick={() => deleteConfirmKomen = komenKey}>🗑️</button>
								{/if}
							</div>
							<p class="comment-text">{comment.komen}</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>Tiada komen untuk penceramah pada bulan ini.</p>
				</div>
			{/if}
		{:else}
			<!-- Cadangan Masjid - Senarai Terus -->
			{#if data.mosqueSuggestions.length > 0}
				<div class="suggestions-list">
					{#each data.mosqueSuggestions as suggestion}
						{@const cadanganKey = getCadanganKey(suggestion)}
						<div class="suggestion-item">
							<div class="suggestion-header">
								<div class="suggestion-meta">
									<span class="suggestion-author">{suggestion.nama_penilai}</span>
									<span class="suggestion-date">{suggestion.tarikh}</span>
								</div>
								{#if deleteConfirmCadangan === cadanganKey}
									<div class="delete-confirm">
										<form method="POST" action="?/clearCadangan" use:enhance={() => {
											return async ({ update }) => {
												deleteConfirmCadangan = null;
												await update();
											};
										}}>
											<input type="hidden" name="nama" value={suggestion.nama_penilai} />
											<input type="hidden" name="tarikh" value={suggestion.tarikh} />
											<input type="hidden" name="cadangan" value={suggestion.cadangan} />
											<button type="submit" class="btn-confirm-delete">Pasti?</button>
										</form>
										<button class="btn-cancel" onclick={() => deleteConfirmCadangan = null}>Batal</button>
									</div>
								{:else}
									<button class="btn-delete" onclick={() => deleteConfirmCadangan = cadanganKey}>🗑️</button>
								{/if}
							</div>
							<p class="suggestion-text">{suggestion.cadangan}</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p>Tiada cadangan untuk masjid pada bulan ini.</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: #666;
	}

	.filter-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #eee;
		padding-bottom: 0;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		cursor: pointer;
		font-size: 0.95rem;
		color: #666;
		transition: all 0.2s ease;
	}

	.tab:hover {
		color: #1a5f2a;
	}

	.tab.active {
		color: #1a5f2a;
		border-bottom-color: #1a5f2a;
		font-weight: 600;
	}

	.content {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Comments List */
	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.comment-item {
		background: #f9f9f9;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		border-left: 3px solid #1a5f2a;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.comment-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.comment-author {
		font-weight: 600;
		font-size: 0.9rem;
		color: #333;
	}

	.comment-date {
		font-size: 0.8rem;
		color: #999;
	}

	.comment-text {
		margin: 0;
		font-size: 0.95rem;
		color: #444;
		line-height: 1.5;
	}

	/* Mosque Suggestions */
	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.suggestion-item {
		background: #fff8e1;
		border-radius: 0.5rem;
		padding: 1rem;
		border-left: 3px solid #f9a825;
	}

	.suggestion-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.suggestion-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.suggestion-author {
		font-weight: 600;
		font-size: 0.9rem;
		color: #333;
	}

	.suggestion-date {
		font-size: 0.8rem;
		color: #999;
	}

	.suggestion-text {
		margin: 0;
		font-size: 0.95rem;
		color: #444;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #999;
	}

	/* Delete buttons */
	.btn-delete {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.btn-delete:hover {
		opacity: 1;
	}

	.delete-confirm {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-confirm-delete {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.btn-confirm-delete:hover {
		background: #c82333;
	}

	.btn-cancel {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #5a6268;
	}

	@media (max-width: 640px) {
		.tabs {
			flex-direction: column;
			gap: 0;
		}

		.tab {
			border-bottom: none;
			border-left: 2px solid transparent;
			margin-bottom: 0;
			margin-left: -2px;
			text-align: left;
		}

		.tab.active {
			border-bottom: none;
			border-left-color: #1a5f2a;
		}
	}
</style>
