import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSession, verifyPassword, createSession } from '$lib/server/auth';
import { query } from '$lib/server/db';

export const load: PageServerLoad = async ({ cookies }) => {
	const admin = await getSession(cookies);

	// If already logged in, redirect to dashboard
	if (admin) {
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

		try {
			const result = await query(
				'SELECT id, email, password_hash FROM admins WHERE email = $1 LIMIT 1',
				[email]
			);

			const admin = result.rows[0];

			if (!admin || !admin.password_hash) {
				return fail(401, { error: 'Pengesahan gagal. Sila semak email dan kata laluan.' });
			}

			const valid = await verifyPassword(password, admin.password_hash);
			if (!valid) {
				return fail(401, { error: 'Pengesahan gagal. Sila semak email dan kata laluan.' });
			}

			await createSession(admin.id, cookies);
		} catch (err) {
			console.error('Login error:', err);
			return fail(500, { error: 'Ralat pelayan. Sila cuba lagi.' });
		}

		throw redirect(303, '/admin/dashboard');
	}
};
