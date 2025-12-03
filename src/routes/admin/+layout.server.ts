import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';

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

	// Verify user is admin
	const { data: adminData, error: adminError } = await supabase
		.from('admins')
		.select('id, email')
		.eq('id', session.user.id)
		.single();

	if (adminError || !adminData) {
		// Sign out and redirect if not admin
		await supabase.auth.signOut();
		throw redirect(303, '/admin/login');
	}

	return {
		session,
		admin: adminData
	};
};
