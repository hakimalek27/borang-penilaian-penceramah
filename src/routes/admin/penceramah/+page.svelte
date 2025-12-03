<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Input } from '$lib/components/ui';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddForm = $state(false);
	let editingId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let isUploading = $state(false);

	// Form fields
	let nama = $state('');
	let keterangan = $state('');
	let sortOrder = $state(0);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			selectedFile = file;
			previewUrl = URL.createObjectURL(file);
		}
	}

	function clearFile() {
		selectedFile = null;
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	}

	function startEdit(lecturer: typeof data.lecturers[0]) {
		editingId = lecturer.id;
		nama = lecturer.nama;
		keterangan = lecturer.keterangan || '';
		sortOrder = lecturer.sort_order;
		showAddForm = false;
	}

	function cancelEdit() {
		editingId = null;
		resetForm();
	}

	function resetForm() {
		nama = '';
		keterangan = '';
		sortOrder = 0;
		clearFile();
	}

	function handleFormSuccess() {
		showAddForm = false;
		editingId = null;
		resetForm();
	}
</script>

<svelte:head>
	<title>Tetapan Penceramah - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Tetapan Penceramah</h1>
		<Button onclick={() => { showAddForm = !showAddForm; editingId = null; resetForm(); }}>
			{showAddForm ? 'Batal' : '+ Tambah Penceramah'}
		</Button>
	</div>

	{#if showAddForm}
		<div class="form-card">
			<h2>Tambah Penceramah Baru</h2>
			<form method="POST" action="?/create" enctype="multipart/form-data" use:enhance={() => {
				isUploading = true;
				return async ({ result, update }) => {
					isUploading = false;
					if (result.type === 'success') {
						handleFormSuccess();
					}
					await update();
				};
			}}>
				<Input label="Nama Penceramah" name="nama" bind:value={nama} required />
				
				<div class="file-upload-group">
					<label for="gambar">Gambar Penceramah (Pilihan)</label>
					<input 
						type="file" 
						id="gambar" 
						name="gambar" 
						accept="image/*"
						onchange={handleFileSelect}
					/>
					{#if previewUrl}
						<div class="preview-container">
							<img src={previewUrl} alt="Preview" class="preview-image" />
							<button type="button" class="clear-btn" onclick={clearFile}>✕</button>
						</div>
					{/if}
				</div>

				<div class="textarea-group">
					<label for="keterangan">Keterangan (Pilihan)</label>
					<textarea id="keterangan" name="keterangan" bind:value={keterangan} rows="2"></textarea>
				</div>
				<Input label="Susunan" name="sort_order" type="number" bind:value={sortOrder} />
				<div class="form-actions">
					<Button type="submit" loading={isUploading}>Simpan</Button>
					<Button type="button" variant="secondary" onclick={() => showAddForm = false}>Batal</Button>
				</div>
			</form>
		</div>
	{/if}

	<div class="lecturers-list">
		{#if data.lecturers.length === 0}
			<div class="empty-state">
				<p>Tiada penceramah. Klik "Tambah Penceramah" untuk menambah.</p>
			</div>
		{:else}
			{#each data.lecturers as lecturer}
				<div class="lecturer-card">
					{#if editingId === lecturer.id}
						<form method="POST" action="?/update" enctype="multipart/form-data" use:enhance={() => {
							isUploading = true;
							return async ({ result, update }) => {
								isUploading = false;
								if (result.type === 'success') {
									handleFormSuccess();
								}
								await update();
							};
						}}>
							<input type="hidden" name="id" value={lecturer.id} />
							<Input label="Nama" name="nama" bind:value={nama} required />
							
							<div class="file-upload-group">
								<label for="edit-gambar">Gambar Baru (Pilihan)</label>
								<input 
									type="file" 
									id="edit-gambar" 
									name="gambar" 
									accept="image/*"
									onchange={handleFileSelect}
								/>
								{#if previewUrl}
									<div class="preview-container">
										<img src={previewUrl} alt="Preview" class="preview-image" />
										<button type="button" class="clear-btn" onclick={clearFile}>✕</button>
									</div>
								{:else if lecturer.gambar_url}
									<div class="current-photo">
										<img src={lecturer.gambar_url} alt={lecturer.nama} />
										<span>Gambar semasa</span>
									</div>
								{/if}
							</div>

							<div class="textarea-group">
								<label for="edit-keterangan">Keterangan</label>
								<textarea id="edit-keterangan" name="keterangan" bind:value={keterangan} rows="2"></textarea>
							</div>
							<Input label="Susunan" name="sort_order" type="number" bind:value={sortOrder} />
							<div class="form-actions">
								<Button type="submit" size="sm" loading={isUploading}>Simpan</Button>
								<Button type="button" variant="secondary" size="sm" onclick={cancelEdit}>Batal</Button>
							</div>
						</form>
					{:else}
						<div class="lecturer-info">
							<div class="lecturer-photo">
								{#if lecturer.gambar_url}
									<img src={lecturer.gambar_url} alt={lecturer.nama} />
								{:else}
									<div class="placeholder-avatar">👤</div>
								{/if}
							</div>
							<div class="lecturer-details">
								<h3>{lecturer.nama}</h3>
								{#if lecturer.keterangan}
									<p class="keterangan">{lecturer.keterangan}</p>
								{/if}
								<span class="sort-order">Susunan: {lecturer.sort_order}</span>
							</div>
						</div>
						<div class="lecturer-actions">
							<Button size="sm" variant="secondary" onclick={() => startEdit(lecturer)}>Edit</Button>
							{#if deleteConfirmId === lecturer.id}
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={lecturer.id} />
									<Button type="submit" size="sm" variant="danger">Pasti Padam?</Button>
								</form>
								<Button size="sm" variant="secondary" onclick={() => deleteConfirmId = null}>Batal</Button>
							{:else}
								<Button size="sm" variant="danger" onclick={() => deleteConfirmId = lecturer.id}>Padam</Button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 900px;
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

	.textarea-group {
		margin-bottom: 1rem;
	}

	.textarea-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		resize: vertical;
	}

	textarea:focus {
		outline: none;
		border-color: #1a5f2a;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.file-upload-group {
		margin-bottom: 1rem;
	}

	.file-upload-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.file-upload-group input[type="file"] {
		width: 100%;
		padding: 0.5rem;
		border: 1px dashed #ccc;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.preview-container {
		position: relative;
		display: inline-block;
		margin-top: 0.5rem;
	}

	.preview-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 50%;
		border: 2px solid #1a5f2a;
	}

	.current-photo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.current-photo img {
		width: 50px;
		height: 50px;
		object-fit: cover;
		border-radius: 50%;
		border: 1px solid #ddd;
	}

	.current-photo span {
		font-size: 0.8rem;
		color: #666;
	}

	.clear-btn {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #dc3545;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lecturers-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.lecturer-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.lecturer-info {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.lecturer-photo {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: #f0f0f0;
	}

	.lecturer-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.placeholder-avatar {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		background: #e0e0e0;
	}

	.lecturer-details {
		flex: 1;
	}

	.lecturer-details h3 {
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.keterangan {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.sort-order {
		font-size: 0.8rem;
		color: #999;
	}

	.lecturer-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 0.75rem;
		color: #666;
	}
</style>
