<script lang="ts">
	interface Props {
		komenPenceramah: string;
		cadanganMasjid: string;
	}

	let { 
		komenPenceramah = $bindable(''), 
		cadanganMasjid = $bindable('') 
	}: Props = $props();
</script>

<div class="comment-section">
	<div class="textarea-group">
		<label for="komen-penceramah">Komen kepada Penceramah</label>
		<textarea 
			id="komen-penceramah"
			bind:value={komenPenceramah}
			placeholder="Masukkan komen anda kepada penceramah (pilihan)"
			rows="3"
		></textarea>
	</div>

	<div class="textarea-group">
		<label for="cadangan-masjid">Cadangan kepada pihak Masjid</label>
		<textarea 
			id="cadangan-masjid"
			bind:value={cadanganMasjid}
			placeholder="Masukkan cadangan anda kepada pihak masjid (pilihan)"
			rows="3"
		></textarea>
	</div>
</div>

<style>
	.comment-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.textarea-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	textarea {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		resize: vertical;
		min-height: 80px;
		transition: border-color 0.2s ease;
	}

	textarea:focus {
		outline: none;
		border-color: #1a5f2a;
		box-shadow: 0 0 0 3px rgba(26, 95, 42, 0.1);
	}

	textarea::placeholder {
		color: #999;
	}
</style>
