import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';

// Hardcoded production URL - this ensures QR code always points to correct domain
const PRODUCTION_URL = 'https://bpph.pages.dev';

export const load: PageServerLoad = async () => {
	// Always use production URL for QR code to ensure consistency
	const formUrl = PRODUCTION_URL;
	
	// Generate QR code as data URL
	let qrCodeDataUrl = '';
	let errorMessage = '';
	
	try {
		qrCodeDataUrl = await QRCode.toDataURL(formUrl, {
			width: 400,
			margin: 2,
			errorCorrectionLevel: 'M',
			color: {
				dark: '#1a5f2a',
				light: '#ffffff'
			}
		});
	} catch (error) {
		console.error('Error generating QR code:', error);
		errorMessage = error instanceof Error ? error.message : 'Ralat tidak diketahui';
	}

	return {
		formUrl,
		qrCodeDataUrl,
		errorMessage
	};
};
