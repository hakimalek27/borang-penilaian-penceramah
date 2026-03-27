import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';

// Urutan hari dalam minggu
const dayOrder: Record<string, number> = {
	'Isnin': 1,
	'Selasa': 2,
	'Rabu': 3,
	'Khamis': 4,
	'Jumaat': 5,
	'Sabtu': 6,
	'Ahad': 7
};

// Urutan jenis kuliah: Subuh → Tazkirah Jumaat → Maghrib
const lectureTypeOrder: Record<string, number> = {
	'Subuh': 1,
	'Tazkirah Jumaat': 2,
	'Maghrib': 3
};

export const load: PageServerLoad = async () => {
	// Fetch ALL sessions with lecturer info
	const sessionsResult = await query(`
		SELECT ls.*, row_to_json(l.*) as lecturer
		FROM lecture_sessions ls
		LEFT JOIN lecturers l ON l.id = ls.lecturer_id
		ORDER BY ls.minggu, ls.hari, ls.jenis_kuliah
	`);

	const sessions = sessionsResult.rows.map(row => ({
		...row,
		lecturer: row.lecturer?.id ? { id: row.lecturer.id, nama: row.lecturer.nama, gambar_url: row.lecturer.gambar_url } : null
	}));

	// Sort sessions by minggu, then hari, then jenis_kuliah
	const sortedSessions = sessions.sort((a, b) => {
		if (a.minggu !== b.minggu) {
			return a.minggu - b.minggu;
		}
		const dayDiff = (dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99);
		if (dayDiff !== 0) {
			return dayDiff;
		}
		return (lectureTypeOrder[a.jenis_kuliah] || 99) - (lectureTypeOrder[b.jenis_kuliah] || 99);
	});

	// Fetch all lecturers for dropdown
	const lecturersResult = await query(
		'SELECT id, nama FROM lecturers ORDER BY sort_order ASC, nama ASC'
	);

	// Group sessions by week
	const sessionsByWeek: Record<number, typeof sortedSessions> = {};
	for (let week = 1; week <= 5; week++) {
		sessionsByWeek[week] = [];
	}

	for (const session of sortedSessions) {
		if (sessionsByWeek[session.minggu]) {
			sessionsByWeek[session.minggu]!.push(session);
		}
	}

	return {
		sessionsByWeek,
		lecturers: lecturersResult.rows
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const minggu = parseInt(formData.get('minggu') as string);
		const hari = formData.get('hari') as string;
		const jenis_kuliah = formData.get('jenis_kuliah') as string;
		const lecturer_id = formData.get('lecturer_id') as string;

		if (!minggu || !hari || !jenis_kuliah || !lecturer_id) {
			return fail(400, { error: 'Semua medan diperlukan' });
		}

		try {
			await query(
				`INSERT INTO lecture_sessions (bulan, tahun, minggu, hari, jenis_kuliah, lecturer_id, is_active)
				 VALUES (0, 0, $1, $2, $3, $4, true)`,
				[minggu, hari, jenis_kuliah, lecturer_id]
			);
		} catch (err: unknown) {
			console.error('Error creating session:', err);
			if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
				return fail(400, { error: 'Sesi ini sudah wujud' });
			}
			return fail(500, { error: 'Ralat semasa menambah sesi' });
		}

		return { success: true };
	},

	toggleActive: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const is_active = formData.get('is_active') === 'true';

		if (!id) {
			return fail(400, { error: 'ID sesi diperlukan' });
		}

		try {
			await query(
				'UPDATE lecture_sessions SET is_active = $1 WHERE id = $2',
				[!is_active, id]
			);
		} catch (err) {
			console.error('Error toggling session:', err);
			return fail(500, { error: 'Ralat semasa mengemaskini sesi' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID sesi diperlukan' });
		}

		try {
			await query('DELETE FROM lecture_sessions WHERE id = $1', [id]);
		} catch (err) {
			console.error('Error deleting session:', err);
			return fail(500, { error: 'Ralat semasa memadam sesi' });
		}

		return { success: true };
	}
};
