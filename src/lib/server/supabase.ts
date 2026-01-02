import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

export const createClient = (cookies: Cookies) => {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
};

// Service role client for bypassing RLS (use only on server for public submissions)
export const createServiceRoleClient = () => {
	return createSupabaseClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};
