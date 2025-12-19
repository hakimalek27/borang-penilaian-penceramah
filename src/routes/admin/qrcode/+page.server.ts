import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';
import QRCode from 'qrcode';

// Default fallback URL if env variable not set
const DEFAULT_URL = 'https://bpp.mamkl.my';

export const load: PageServerLoad = async ({ url }) => {
	// Priority: 1. Environment variable, 2. Auto-detect from request, 3. Default fallback
	const formUrl = env.PUBLIC_FORM_URL || url.origin || DEFAULT_URL;
	
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
