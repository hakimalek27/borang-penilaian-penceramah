import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import { query } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	// Skip auth check for login page
	if (url.pathname === '/admin/login') {
		return {};
	}

	const supabase = createClient(cookies);
	const { data: { session } } = await supabase.auth.getSession();

	// Redirect to login if not authenticated
	if (!session) {
		throw redirect(303, '/admin/login');
	}

	try {
		const result = await query(
			'SELECT id, email FROM admins WHERE id = $1 LIMIT 1',
			[session.user.id]
		);

		const adminData = result.rows[0];

		if (!adminData) {
			await supabase.auth.signOut();
			throw redirect(303, '/admin/login');
		}

		return {
			session,
			admin: adminData
		};
	} catch (error) {
		console.error('Error checking admin:', error);
		await supabase.auth.signOut();
		throw redirect(303, '/admin/login');
	}
};
