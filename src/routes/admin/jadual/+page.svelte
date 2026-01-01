<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Select } from '$lib/components/ui';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddForm = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let formError = $state<string | null>(null);
	let isSubmitting = $state(false);

	// Form fields
	let minggu = $state(1);
	let hari = $state('Isnin');
	let jenisKuliah = $state('Subuh');
	let lecturerId = $state('');

	const hariOptions = [
		{ value: 'Isnin', label: 'Isnin' },
		{ value: 'Selasa', label: 'Selasa' },
		{ value: 'Rabu', label: 'Rabu' },
		{ value: 'Khamis', label: 'Khamis' },
		{ value: 'Jumaat', label: 'Jumaat' },
		{ value: 'Sabtu', label: 'Sabtu' },
		{ value: 'Ahad', label: 'Ahad' }
	];

	const mingguOptions = [
		{ value: 1, label: 'Minggu 1' },
		{ value: 2, label: 'Minggu 2' },
		{ value: 3, label: 'Minggu 3' },
		{ value: 4, label: 'Minggu 4' },
		{ value: 5, label: 'Minggu 5' }
	];

	const jenisOptions = [
		{ value: 'Subuh', label: 'Kuliah Subuh' },
		{ value: 'Maghrib', label: 'Kuliah Maghrib' },
		{ value: 'Tazkirah Jumaat', label: 'Tazkirah Jumaat' }
	];

	function resetForm() {
		minggu = 1;
		hari = 'Isnin';
		jenisKuliah = 'Subuh';
		lecturerId = '';
	}

	const lecturerOptions = $derived(
		data.lecturers.map(l => ({ value: l.id, label: l.nama }))
	);
</script>

<svelte:head>
	<title>Tetapan Jadual - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Tetapan Jadual Kuliah</h1>
		<Button onclick={() => { showAddForm = !showAddForm; resetForm(); }}>
			{showAddForm ? 'Batal' : '+ Tambah Sesi'}
		</Button>
	</div>

	{#if showAddForm}
		<div class="form-card">
			<h2>Tambah Sesi Kuliah</h2>
			{#if formError}
				<div class="alert alert-error">{formError}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance={() => {
				formError = null;
				isSubmitting = true;
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						showAddForm = false;
						resetForm();
					} else if (result.type === 'failure') {
						formError = (result.data as { error?: string })?.error || 'Ralat semasa menyimpan';
					}
					await update();
				};
			}}>
				<div class="form-grid">
					<Select label="Minggu" name="minggu" options={mingguOptions} bind:value={minggu} required />
					<Select label="Hari" name="hari" options={hariOptions} bind:value={hari} required />
					<Select label="Jenis Kuliah" name="jenis_kuliah" options={jenisOptions} bind:value={jenisKuliah} required />
					<Select label="Penceramah" name="lecturer_id" options={lecturerOptions} bind:value={lecturerId} required placeholder="Pilih penceramah" />
				</div>
				
				<div class="form-actions">
					<Button type="submit" loading={isSubmitting}>Simpan</Button>
					<Button type="button" variant="secondary" onclick={() => showAddForm = false}>Batal</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Schedule Grid -->
	<div class="schedule-grid">
		{#each [1, 2, 3, 4, 5] as week}
			<div class="week-section">
				<h3>Minggu {week}</h3>
				{#if data.sessionsByWeek[week]?.length > 0}
					<div class="sessions-list">
						{#each data.sessionsByWeek[week] as session}
							<div class="session-card" class:inactive={!session.is_active}>
								<div class="session-info">
									<div class="session-lecturer">
										{session.lecturer?.nama || 'Penceramah'}
									</div>
									<div class="session-details">
										<span class="session-type" class:subuh={session.jenis_kuliah === 'Subuh'}>
											{session.jenis_kuliah}
										</span>
										<span class="session-day">{session.hari}</span>
										{#if !session.is_active}
											<span class="inactive-badge">Tidak Aktif</span>
										{/if}
									</div>
								</div>
								<div class="session-actions">
									<form method="POST" action="?/toggleActive" use:enhance>
										<input type="hidden" name="id" value={session.id} />
										<input type="hidden" name="is_active" value={session.is_active} />
										<Button type="submit" size="sm" variant="secondary">
											{session.is_active ? 'Nyahaktif' : 'Aktifkan'}
										</Button>
									</form>
									{#if deleteConfirmId === session.id}
										<form method="POST" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={session.id} />
											<Button type="submit" size="sm" variant="danger">Pasti?</Button>
										</form>
										<Button size="sm" variant="secondary" onclick={() => deleteConfirmId = null}>Batal</Button>
									{:else}
										<Button size="sm" variant="danger" onclick={() => deleteConfirmId = session.id}>Padam</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-sessions">Tiada sesi dijadualkan</p>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.page {
		max-width: 1000px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		color: #333;
	}

	.filter-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		background: white;
		padding: 1rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.filter-bar :global(.select-group) {
		margin-bottom: 0;
	}

	.form-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-card h2 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
		color: #333;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.schedule-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.week-section {
		background: white;
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.week-section h3 {
		font-size: 1rem;
		color: #1a5f2a;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e5e5;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.session-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9f9f9;
		border-radius: 0.5rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.session-card.inactive {
		opacity: 0.6;
		background: #f0f0f0;
	}

	.session-lecturer {
		font-weight: 500;
		color: #333;
	}

	.session-details {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}

	.session-type {
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: #e8f5e9;
		color: #1a5f2a;
		font-weight: 500;
	}

	.session-type.subuh {
		background: #fff3e0;
		color: #e65100;
	}

	.session-day {
		color: #666;
	}

	.inactive-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
		background: #ffebee;
		color: #c62828;
		font-size: 0.75rem;
	}

	.session-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.no-sessions {
		color: #999;
		font-style: italic;
		text-align: center;
		padding: 1rem;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.alert-error {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #ef9a9a;
	}
</style>
