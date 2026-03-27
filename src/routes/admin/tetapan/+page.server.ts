import type { PageServerLoad, Actions } from './$types';
import { query } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const result = await query('SELECT key, value FROM settings');

	const settingsMap = new Map(result.rows.map((s: { key: string; value: unknown }) => [s.key, s.value]));

	return {
		emailNotificationsEnabled: settingsMap.get('email_notifications_enabled') === true,
		alertThreshold: (settingsMap.get('alert_threshold') as number) ?? 2.0,
		adminEmails: (settingsMap.get('admin_emails') as string[]) ?? []
	};
};

export const actions: Actions = {
	updateEmailSettings: async ({ request }) => {
		const formData = await request.formData();
		const enabled = formData.has('enabled');
		const emailsRaw = formData.get('emails') as string || '';

		const emails = emailsRaw
			.split(',')
			.map(e => e.trim())
			.filter(e => e.length > 0 && e.includes('@'));

		try {
			await query(
				`INSERT INTO settings (key, value) VALUES ('email_notifications_enabled', $1::jsonb)
				 ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
				[JSON.stringify(enabled)]
			);

			await query(
				`INSERT INTO settings (key, value) VALUES ('admin_emails', $1::jsonb)
				 ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
				[JSON.stringify(emails)]
			);
		} catch (err) {
			console.error('Error updating email settings:', err);
			return fail(500, { error: 'Gagal menyimpan tetapan notifikasi' });
		}

		return { success: true, message: 'Tetapan notifikasi berjaya dikemaskini' };
	},

	updateAlertThreshold: async ({ request }) => {
		const formData = await request.formData();
		const threshold = parseFloat(formData.get('threshold') as string);

		if (isNaN(threshold) || threshold < 1 || threshold > 4) {
			return fail(400, { error: 'Nilai threshold tidak sah (mesti antara 1.0 dan 4.0)' });
		}

		try {
			await query(
				`INSERT INTO settings (key, value) VALUES ('alert_threshold', $1::jsonb)
				 ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
				[JSON.stringify(threshold)]
			);
		} catch (err) {
			console.error('Error updating alert threshold:', err);
			return fail(500, { error: 'Gagal menyimpan tetapan alert' });
		}

		return { success: true, message: 'Tetapan alert berjaya dikemaskini' };
	}
};
