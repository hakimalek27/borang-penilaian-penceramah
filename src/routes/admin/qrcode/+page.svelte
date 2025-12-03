<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui';

	let { data }: { data: PageData } = $props();

	function downloadQRCode() {
		const link = document.createElement('a');
		link.download = 'qrcode-borang-penilaian.png';
		link.href = data.qrCodeDataUrl;
		link.click();
	}

	function printQRCode() {
		window.print();
	}
</script>

<svelte:head>
	<title>QR Code Borang - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>QR Code Borang Penilaian</h1>
		<p class="subtitle">Cetak atau muat turun QR code untuk dikongsi kepada jemaah</p>
	</div>

	<div class="qr-container">
		<div class="qr-card">
			<div class="qr-image">
				{#if data.qrCodeDataUrl}
					<img src={data.qrCodeDataUrl} alt="QR Code Borang Penilaian" />
				{:else}
					<p>Ralat menjana QR code</p>
				{/if}
			</div>
			
			<div class="qr-info">
				<h2>Borang Maklum Balas Kuliah</h2>
				<p class="qr-url">{data.formUrl}</p>
				<p class="qr-instruction">Imbas kod QR ini untuk mengisi borang penilaian kuliah bulanan</p>
			</div>

			<div class="qr-actions no-print">
				<Button onclick={downloadQRCode}>📥 Muat Turun</Button>
				<Button variant="secondary" onclick={printQRCode}>🖨️ Cetak</Button>
			</div>
		</div>

		<div class="usage-tips no-print">
			<h3>💡 Cadangan Penggunaan</h3>
			<ul>
				<li>Cetak dan tampal di papan notis masjid</li>
				<li>Paparkan di skrin TV masjid selepas kuliah</li>
				<li>Kongsi di group WhatsApp jemaah</li>
				<li>Masukkan dalam risalah atau buletin masjid</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	h1 {
		font-size: 1.5rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.qr-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.qr-image {
		margin-bottom: 1.5rem;
	}

	.qr-image img {
		max-width: 300px;
		width: 100%;
		height: auto;
		border: 4px solid #1a5f2a;
		border-radius: 1rem;
		padding: 1rem;
		background: white;
	}

	.qr-info h2 {
		font-size: 1.25rem;
		color: #1a5f2a;
		margin-bottom: 0.5rem;
	}

	.qr-url {
		font-family: monospace;
		font-size: 0.9rem;
		color: #666;
		background: #f5f5f5;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		word-break: break-all;
	}

	.qr-instruction {
		color: #555;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
	}

	.qr-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.usage-tips {
		background: #f0f7f1;
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.usage-tips h3 {
		font-size: 1rem;
		color: #1a5f2a;
		margin-bottom: 1rem;
	}

	.usage-tips ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.usage-tips li {
		color: #555;
		margin-bottom: 0.5rem;
	}

	@media print {
		.no-print {
			display: none !important;
		}

		.page {
			max-width: 100%;
		}

		.qr-card {
			box-shadow: none;
			border: 2px solid #1a5f2a;
		}

		.qr-image img {
			max-width: 250px;
		}
	}
</style>
