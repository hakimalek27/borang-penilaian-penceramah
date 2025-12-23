<script lang="ts">
	import { Input } from '$lib/components/ui';

	interface Props {
		nama: string;
		umur: number;
		alamat: string;
		tarikh: string;
		errors: Record<string, string>;
	}

	let { 
		nama = $bindable(), 
		umur = $bindable(), 
		alamat = $bindable(), 
		tarikh = $bindable(),
		errors = {}
	}: Props = $props();
</script>

<div class="evaluator-form">
	<Input 
		label="Nama Penilai"
		bind:value={nama}
		placeholder="Masukkan nama anda"
		required
		error={errors.nama}
	/>

	<Input 
		label="Umur"
		type="number"
		bind:value={umur}
		placeholder="Masukkan umur"
		min="1"
		max="150"
		required
		error={errors.umur}
	/>

	<div class="textarea-group">
		<label for="alamat">
			Alamat ringkas
			<span class="required">*</span>
		</label>
		<textarea 
			id="alamat"
			bind:value={alamat}
			placeholder="Masukkan alamat anda"
			rows="2"
			class:error={errors.alamat}
		></textarea>
		{#if errors.alamat}
			<span class="error-message">{errors.alamat}</span>
		{/if}
	</div>

	<Input 
		label="Tarikh"
		type="date"
		bind:value={tarikh}
		required
		error={errors.tarikh}
	/>
</div>

<style>
	.evaluator-form {
		display: grid;
		gap: 0.5rem;
	}

	.textarea-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.required {
		color: #dc3545;
		margin-left: 0.25rem;
	}

	textarea {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		resize: vertical;
		min-height: 60px;
		transition: border-color 0.2s ease;
	}

	textarea:focus {
		outline: none;
		border-color: #1a5f2a;
		box-shadow: 0 0 0 3px rgba(26, 95, 42, 0.1);
	}

	textarea.error {
		border-color: #dc3545;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.8rem;
	}

	@media (min-width: 640px) {
		.evaluator-form {
			grid-template-columns: 1fr 1fr;
		}

		.textarea-group {
			grid-column: span 2;
		}
	}
</style>
