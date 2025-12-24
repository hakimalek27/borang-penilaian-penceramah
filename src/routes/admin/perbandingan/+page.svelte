<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button, Select } from '$lib/components/ui';
	import LecturerComparison from '$lib/components/admin/LecturerComparison.svelte';

	let { data }: { data: PageData } = $props();

	// State for lecturer selection
	let selectedLecturers = $state<string[]>(data.selectedIds || []);
	let filterMonth = $state<number | string>(data.filters.month || '');
	let filterYear = $state<number | string>(data.filters.year || '');

	// Generate month options
	const monthOptions = [
		{ value: '', label: 'Semua Bulan' },
		{ value: 1, label: 'Januari' },
		{ value: 2, label: 'Februari' },
		{ value: 3, label: 'Mac' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'Mei' },
		{ value: 6, label: 'Jun' },
		{ value: 7, label: 'Julai' },
		{ value: 8, label: 'Ogos' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'Oktober' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'Disember' }
	];

	// Generate year options
	const currentYear = new Date().getFullYear();
	const yearOptions = [
		{ value: '', label: 'Semua Tahun' },
		...Array.from({ length: 5 }, (_, i) => ({
			value: currentYear - i,
			label: String(currentYear - i)
		}))
	];

	function toggleLecturer(lecturerId: string) {
		if (selectedLecturers.includes(lecturerId)) {
			selectedLecturers = selectedLecturers.filter((id) => id !== lecturerId);
		} else if (selectedLecturers.length < 5) {
			selectedLecturers = [...selectedLecturers, lecturerId];
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedLecturers.length > 0) {
			params.set('lecturers', selectedLecturers.join(','));
		}
		if (filterMonth) {
			params.set('month', String(filterMonth));
		}
		if (filterYear) {
			params.set('year', String(filterYear));
		}
		goto(`/admin/perbandingan?${params.toString()}`);
	}

	function clearSelection() {
		selectedLecturers = [];
		filterMonth = '';
		filterYear = '';
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
			<h2>Pilih Penceramah</h2>
			<p class="hint">Pilih sehingga 5 penceramah untuk perbandingan</p>

			<div class="lecturer-list">
				{#each data.lecturers as lecturer}
					<label class="lecturer-checkbox" class:selected={selectedLecturers.includes(lecturer.id)}>
						<input
							type="checkbox"
							checked={selectedLecturers.includes(lecturer.id)}
							disabled={!selectedLecturers.includes(lecturer.id) && selectedLecturers.length >= 5}
							onchange={() => toggleLecturer(lecturer.id)}
						/>
						<span>{lecturer.nama}</span>
					</label>
				{/each}
			</div>

			<div class="filters">
				<h3>Penapis</h3>
				<div class="filter-row">
					<Select bind:value={filterMonth} options={monthOptions} />
					<Select bind:value={filterYear} options={yearOptions} />
				</div>
			</div>

			<div class="actions">
				<Button onclick={applyFilters} disabled={selectedLecturers.length < 2}>
					Bandingkan ({selectedLecturers.length})
				</Button>
				<Button variant="secondary" onclick={clearSelection}>Reset</Button>
			</div>
		</div>

		<!-- Comparison Results -->
		<div class="results-panel">
			{#if data.comparisons.length > 0}
				<LecturerComparison comparisons={data.comparisons} />
			{:else}
				<div class="empty-state">
					<p>Pilih sekurang-kurangnya 2 penceramah untuk melihat perbandingan</p>
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
		grid-template-columns: 300px 1fr;
		gap: 1.5rem;
	}

	.selection-panel {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		height: fit-content;
	}

	.selection-panel h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.hint {
		font-size: 0.75rem;
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.lecturer-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: 1.5rem;
	}

	.lecturer-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.lecturer-checkbox:hover {
		background-color: #f3f4f6;
	}

	.lecturer-checkbox.selected {
		background-color: #eff6ff;
	}

	.lecturer-checkbox input {
		accent-color: #3b82f6;
	}

	.lecturer-checkbox input:disabled {
		cursor: not-allowed;
	}

	.filters {
		margin-bottom: 1.5rem;
	}

	.filters h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.filter-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.results-panel {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-height: 400px;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 300px;
		color: #6b7280;
		text-align: center;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.selection-panel {
			order: 1;
		}

		.results-panel {
			order: 2;
		}
	}
</style>
