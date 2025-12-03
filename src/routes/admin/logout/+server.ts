import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ cookies }) => {
	const supabase = createClient(cookies);
	await supabase.auth.signOut();
	throw redirect(303, '/admin/login');
};
