import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';

export const load: PageServerLoad = async ({ url }) => {
	// Get the base URL from the request
	const baseUrl = url.origin;
	const formUrl = baseUrl; // Root URL is the form
	
	// Generate QR code as data URL
	let qrCodeDataUrl = '';
	try {
		qrCodeDataUrl = await QRCode.toDataURL(formUrl, {
			width: 400,
			margin: 2,
			color: {
				dark: '#1a5f2a',
				light: '#ffffff'
			}
		});
	} catch (error) {
		console.error('Error generating QR code:', error);
	}

	return {
		formUrl,
		qrCodeDataUrl
	};
};
