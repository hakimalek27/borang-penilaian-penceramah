import type { PageServerLoad } from './$types';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ url }) => {
	// Use PUBLIC_SITE_URL env variable, fallback to url.origin, then hardcoded domain
	const baseUrl = env.PUBLIC_SITE_URL || url.origin || 'https://bpph.pages.dev';
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
