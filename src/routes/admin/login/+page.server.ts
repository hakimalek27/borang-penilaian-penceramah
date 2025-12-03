import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createClient(cookies);
	const { data: { session } } = await supabase.auth.getSession();

	// If already logged in, redirect to dashboard
	if (session) {
		throw redirect(303, '/admin/dashboard');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email dan kata laluan diperlukan' });
		}

		const supabase = createClient(cookies);

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Auth error:', error);
			return fail(401, { error: 'Pengesahan gagal. Sila semak email dan kata laluan.' });
		}

		// Check if user is admin
		const { data: adminData, error: adminError } = await supabase
			.from('admins')
			.select('id')
			.eq('id', data.user.id)
			.single();

		if (adminError || !adminData) {
			await supabase.auth.signOut();
			return fail(403, { error: 'Akses tidak dibenarkan. Anda bukan admin.' });
		}

		throw redirect(303, '/admin/dashboard');
	}
};
