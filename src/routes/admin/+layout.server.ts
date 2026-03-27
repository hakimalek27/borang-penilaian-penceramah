import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getSession, deleteSession } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	// Skip auth check for login page
	if (url.pathname === '/admin/login') {
		return {};
	}

	try {
		const admin = await getSession(cookies);

		if (!admin) {
			throw redirect(303, '/admin/login');
		}

		return {
			admin
		};
	} catch (error) {
		// Re-throw redirects
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		console.error('Error checking admin:', error);
		await deleteSession(cookies);
		throw redirect(303, '/admin/login');
	}
};
