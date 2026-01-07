<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui';
	import LecturerComparison from '$lib/components/admin/LecturerComparison.svelte';

	let { data }: { data: PageData } = $props();

	// State for lecturer selection
	let selectedLecturers = $state<string[]>(data.selectedIds || []);

	function toggleLecturer(lecturerId: string) {
		if (selectedLecturers.includes(lecturerId)) {
			selectedLecturers = selectedLecturers.filter((id) => id !== lecturerId);
		} else if (selectedLecturers.length < 5) {
			selectedLecturers = [...selectedLecturers, lecturerId];
		}
	}

	function selectAll() {
		// Select first 5 lecturers
		selectedLecturers = data.lecturers.slice(0, 5).map(l => l.id);
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedLecturers.length > 0) {
			params.set('lecturers', selectedLecturers.join(','));
		}
		goto(`/admin/perbandingan?${params.toString()}`);
	}

	function clearSelection() {
		selectedLecturers = [];
		goto('/admin/perbandingan');
	}
</script>

<svelte:head>
	<title>Perbandingan Penceramah - Admin</title>
</svelte:head>

<div class="page-container">
	<header class="page-header">
		<h1>Perbandingan Penceramah</h1>
		<p>Bandingkan prestasi penceramah secara sebelah-menyebelah</p>
	</header>

	<div class="content-grid">
		<!-- Lecturer Selection Panel -->
		<div class="selection-panel">
			<div class="panel-header">
				<h2>Pilih Penceramah</h2>
				<span class="hint">Maksimum 5 penceramah</span>
			</div>

			<div class="quick-actions">
				<button type="button" class="quick-btn" onclick={selectAll}>
					Pilih 5 Pertama
				</button>
				{#if selectedLecturers.length > 0}
					<button type="button" class="quick-btn clear" onclick={clearSelection}>
						Reset
					</button>
				{/if}
			</div>

			<div class="lecturer-list">
				{#each data.lecturers as lecturer}
					<label class="lecturer-checkbox" class:selected={selectedLecturers.includes(lecturer.id)}>
						<input
							type="checkbox"
							checked={selectedLecturers.includes(lecturer.id)}
							disabled={!selectedLecturers.includes(lecturer.id) && selectedLecturers.length >= 5}
							onchange={() => toggleLecturer(lecturer.id)}
						/>
						<span class="lecturer-name">{lecturer.nama}</span>
						{#if selectedLecturers.includes(lecturer.id)}
							<span class="check-badge">{selectedLecturers.indexOf(lecturer.id) + 1}</span>
						{/if}
					</label>
				{/each}
			</div>

			<div class="actions">
				<Button onclick={applyFilters} disabled={selectedLecturers.length < 2}>
					Bandingkan ({selectedLecturers.length})
				</Button>
			</div>
		</div>

		<!-- Comparison Results -->
		<div class="results-panel">
			{#if data.comparisons.length > 0}
				<LecturerComparison comparisons={data.comparisons} />
			{:else}
				<div class="empty-state">
					<div class="empty-icon">⚖️</div>
					<h3>Pilih Penceramah</h3>
					<p>Pilih sekurang-kurangnya 2 penceramah dari senarai di sebelah untuk melihat perbandingan prestasi mereka.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-container {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.page-header p {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 1.5rem;
	}

	.selection-panel {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		height: fit-content;
		position: sticky;
		top: 1rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.panel-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
	}

	.hint {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.quick-actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.quick-btn {
		flex: 1;
		padding: 0.5rem;
		font-size: 0.75rem;
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.quick-btn:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	.quick-btn.clear {
		background: #fef2f2;
		border-color: #fecaca;
		color: #dc2626;
	}

	.quick-btn.clear:hover {
		background: #fee2e2;
	}

	.lecturer-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-height: 400px;
		overflow-y: auto;
		margin-bottom: 1.5rem;
		padding-right: 0.5rem;
	}

	.lecturer-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		border: 1px solid transparent;
	}

	.lecturer-checkbox:hover {
		background-color: #f3f4f6;
	}

	.lecturer-checkbox.selected {
		background-color: #eff6ff;
		border-color: #bfdbfe;
	}

	.lecturer-checkbox input {
		accent-color: #3b82f6;
		width: 18px;
		height: 18px;
	}

	.lecturer-checkbox input:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.lecturer-name {
		flex: 1;
		font-size: 0.875rem;
		color: #374151;
	}

	.check-badge {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #3b82f6;
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.actions {
		display: flex;
	}

	.actions :global(button) {
		width: 100%;
	}

	.results-panel {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-height: 500px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 400px;
		text-align: center;
		padding: 2rem;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: #6b7280;
		max-width: 300px;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.selection-panel {
			position: static;
			order: 1;
		}

		.results-panel {
			order: 2;
		}

		.lecturer-list {
			max-height: 250px;
		}
	}
</style>
