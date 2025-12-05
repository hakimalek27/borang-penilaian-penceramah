<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();
	let isGenerating = $state(false);
	let clientQrCode = $state('');

	// Generate QR code on client-side as fallback
	async function generateClientQR() {
		if (!browser) return;
		isGenerating = true;
		try {
			const QRCode = await import('qrcode');
			clientQrCode = await QRCode.toDataURL(data.formUrl, {
				width: 400,
				margin: 2,
				errorCorrectionLevel: 'M',
				color: {
					dark: '#1a5f2a',
					light: '#ffffff'
				}
			});
		} catch (error) {
			console.error('Client QR generation failed:', error);
		}
		isGenerating = false;
	}

	// Use server QR or client QR
	const qrCodeUrl = $derived(data.qrCodeDataUrl || clientQrCode);

	function downloadQRCode() {
		if (!qrCodeUrl) return;
		const link = document.createElement('a');
		link.download = 'qrcode-borang-penilaian.png';
		link.href = qrCodeUrl;
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
				{#if qrCodeUrl}
					<img src={qrCodeUrl} alt="QR Code Borang Penilaian" />
				{:else if isGenerating}
					<div class="qr-loading">
						<span class="spinner"></span>
						<p>Menjana QR code...</p>
					</div>
				{:else}
					<div class="qr-error">
						<p>⚠️ Ralat menjana QR code</p>
						{#if data.errorMessage}
							<p class="error-detail">{data.errorMessage}</p>
						{/if}
						<Button onclick={generateClientQR}>🔄 Cuba Semula</Button>
					</div>
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

	.qr-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		color: #666;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e0e0e0;
		border-top-color: #1a5f2a;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.qr-error {
		padding: 2rem;
		text-align: center;
		color: #dc3545;
	}

	.qr-error p {
		margin-bottom: 0.5rem;
	}

	.error-detail {
		font-size: 0.85rem;
		color: #999;
		margin-bottom: 1rem !important;
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
