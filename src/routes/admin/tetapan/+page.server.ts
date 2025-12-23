import type { PageServerLoad, Actions } from './$types';
import { createClient } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createClient(cookies);

	// Get settings from database
	const { data: settings } = await supabase
		.from('settings')
		.select('key, value');

	const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);

	return {
		emailNotificationsEnabled: settingsMap.get('email_notifications_enabled') === true,
		alertThreshold: settingsMap.get('alert_threshold') ?? 2.0,
		adminEmails: settingsMap.get('admin_emails') ?? [],
		showRecommendationSection: settingsMap.get('show_recommendation_section') !== false
	};
};

export const actions: Actions = {
	updateEmailSettings: async ({ request, cookies }) => {
		const formData = await request.formData();
		// Checkbox sends 'true' when checked, nothing when unchecked
		const enabled = formData.has('enabled');
		const emailsRaw = formData.get('emails') as string || '';
		
		// Parse and validate emails
		const emails = emailsRaw
			.split(',')
			.map(e => e.trim())
			.filter(e => e.length > 0 && e.includes('@'));

		const supabase = createClient(cookies);

		// Update email notifications enabled
		const { error: enabledError } = await supabase
			.from('settings')
			.upsert({ key: 'email_notifications_enabled', value: enabled }, { onConflict: 'key' });

		if (enabledError) {
			return fail(500, { error: 'Gagal menyimpan tetapan notifikasi' });
		}

		// Update admin emails
		const { error: emailsError } = await supabase
			.from('settings')
			.upsert({ key: 'admin_emails', value: emails }, { onConflict: 'key' });

		if (emailsError) {
			return fail(500, { error: 'Gagal menyimpan senarai email' });
		}

		return { success: true, message: 'Tetapan notifikasi berjaya dikemaskini' };
	},

	updateAlertThreshold: async ({ request, cookies }) => {
		const formData = await request.formData();
		const threshold = parseFloat(formData.get('threshold') as string);

		if (isNaN(threshold) || threshold < 1 || threshold > 4) {
			return fail(400, { error: 'Nilai threshold tidak sah (mesti antara 1.0 dan 4.0)' });
		}

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('settings')
			.upsert({ key: 'alert_threshold', value: threshold }, { onConflict: 'key' });

		if (error) {
			return fail(500, { error: 'Gagal menyimpan tetapan alert' });
		}

		return { success: true, message: 'Tetapan alert berjaya dikemaskini' };
	},

	updateFormSettings: async ({ request, cookies }) => {
		const formData = await request.formData();
		// Checkbox sends 'true' when checked, nothing when unchecked
		const showRecommendation = formData.has('showRecommendation');

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('settings')
			.upsert({ key: 'show_recommendation_section', value: showRecommendation }, { onConflict: 'key' });

		if (error) {
			return fail(500, { error: 'Gagal menyimpan tetapan borang' });
		}

		return { success: true, message: 'Tetapan borang berjaya dikemaskini' };
	}
};
