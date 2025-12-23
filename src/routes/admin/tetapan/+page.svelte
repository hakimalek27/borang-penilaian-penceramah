<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Button, Input } from '$lib/components/ui';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let emailEnabled = $state(data.emailNotificationsEnabled);
	let adminEmails = $state(data.adminEmails?.join(', ') || '');
	let alertThreshold = $state(data.alertThreshold?.toString() || '2.0');
	let showRecommendation = $state(data.showRecommendationSection);
</script>

<svelte:head>
	<title>Tetapan - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Tetapan Sistem</h1>
		<p class="subtitle">Konfigurasi notifikasi dan alert sistem</p>
	</div>

	{#if form?.success}
		<div class="alert success">
			✓ {form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="alert error">
			✗ {form.error}
		</div>
	{/if}

	<div class="settings-grid">
		<!-- Email Notifications Section -->
		<section class="settings-card">
			<h2>📧 Notifikasi Email</h2>
			<p class="description">
				Terima notifikasi email apabila penilaian baru dihantar oleh jemaah.
			</p>

			<form method="POST" action="?/updateEmailSettings" use:enhance>
				<div class="form-group">
					<label class="toggle-label">
						<input 
							type="checkbox" 
							bind:checked={emailEnabled}
							class="toggle-input"
						/>
						<input type="hidden" name="enabled" value={emailEnabled ? 'true' : 'false'} />
						<span class="toggle-switch"></span>
						<span class="toggle-text">
							{emailEnabled ? 'Notifikasi Aktif' : 'Notifikasi Tidak Aktif'}
						</span>
					</label>
				</div>

				<div class="form-group">
					<label for="emails">Email Admin</label>
					<p class="hint">Masukkan alamat email yang akan menerima notifikasi. Pisahkan dengan koma.</p>
					<Input
						id="emails"
						name="emails"
						type="text"
						placeholder="admin1@example.com, admin2@example.com"
						bind:value={adminEmails}
					/>
				</div>

				<div class="form-actions">
					<Button type="submit">Simpan Tetapan Email</Button>
				</div>
			</form>
		</section>

		<!-- Alert System Section -->
		<section class="settings-card">
			<h2>⚠️ Sistem Alert</h2>
			<p class="description">
				Tetapkan threshold untuk alert penceramah dengan skor rendah.
			</p>

			<form method="POST" action="?/updateAlertThreshold" use:enhance>
				<div class="form-group">
					<label for="threshold">Threshold Skor Rendah</label>
					<p class="hint">
						Penceramah dengan purata skor di bawah nilai ini akan ditandakan sebagai alert.
						Nilai antara 1.0 hingga 4.0.
					</p>
					<div class="threshold-input">
						<Input
							id="threshold"
							name="threshold"
							type="number"
							step="0.1"
							min="1"
							max="4"
							bind:value={alertThreshold}
						/>
						<span class="threshold-label">/ 4.0</span>
					</div>
				</div>

				<div class="threshold-preview">
					<div class="preview-bar">
						<div 
							class="preview-marker" 
							style="left: {((parseFloat(alertThreshold) - 1) / 3) * 100}%"
						></div>
						<div class="preview-labels">
							<span>1.0</span>
							<span>2.0</span>
							<span>3.0</span>
							<span>4.0</span>
						</div>
					</div>
					<p class="preview-text">
						Penceramah dengan skor &lt; <strong>{alertThreshold}</strong> akan ditandakan
					</p>
				</div>

				<div class="form-actions">
					<Button type="submit">Simpan Tetapan Alert</Button>
				</div>
			</form>
		</section>

		<!-- Form Settings Section -->
		<section class="settings-card">
			<h2>📝 Tetapan Borang Penilaian</h2>
			<p class="description">
				Kawal paparan section dalam borang penilaian jemaah.
			</p>

			<form method="POST" action="?/updateFormSettings" use:enhance>
				<div class="form-group">
					<label class="toggle-label">
						<input 
							type="checkbox" 
							bind:checked={showRecommendation}
							class="toggle-input"
						/>
						<input type="hidden" name="showRecommendation" value={showRecommendation ? 'true' : 'false'} />
						<span class="toggle-switch"></span>
						<span class="toggle-text">
							{showRecommendation ? 'Papar "Cadangan untuk diteruskan?"' : 'Sembunyikan "Cadangan untuk diteruskan?"'}
						</span>
					</label>
					<p class="hint" style="margin-top: 0.5rem;">
						Jika diaktifkan, jemaah akan diminta untuk menjawab soalan "Cadangan untuk diteruskan?" dalam borang penilaian.
					</p>
				</div>

				<div class="form-actions">
					<Button type="submit">Simpan Tetapan Borang</Button>
				</div>
			</form>
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.5rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
	}

	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.alert.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.settings-card h2 {
		font-size: 1.1rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.description {
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.hint {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
	}

	.toggle-input {
		display: none;
	}

	.toggle-switch {
		width: 48px;
		height: 26px;
		background: #ccc;
		border-radius: 13px;
		position: relative;
		transition: background 0.2s;
	}

	.toggle-switch::after {
		content: '';
		position: absolute;
		width: 22px;
		height: 22px;
		background: white;
		border-radius: 50%;
		top: 2px;
		left: 2px;
		transition: transform 0.2s;
	}

	.toggle-input:checked + .toggle-switch {
		background: #1a5f2a;
	}

	.toggle-input:checked + .toggle-switch::after {
		transform: translateX(22px);
	}

	.toggle-text {
		font-weight: 500;
		color: #333;
	}

	.threshold-input {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 150px;
	}

	.threshold-label {
		color: #666;
		font-weight: 500;
	}

	.threshold-preview {
		background: #f5f5f5;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.preview-bar {
		position: relative;
		height: 8px;
		background: linear-gradient(to right, #dc3545, #ffc107, #28a745);
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.preview-marker {
		position: absolute;
		top: -4px;
		width: 4px;
		height: 16px;
		background: #333;
		border-radius: 2px;
		transform: translateX(-50%);
	}

	.preview-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.preview-text {
		font-size: 0.85rem;
		color: #555;
		text-align: center;
		margin: 0;
	}

	.form-actions {
		margin-top: 1.5rem;
	}

	@media (max-width: 600px) {
		.settings-card {
			padding: 1rem;
		}
	}
</style>
