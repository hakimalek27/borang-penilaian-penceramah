import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';

const monthNames = [
	'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
	'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

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

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createClient(cookies);
	
	const now = new Date();
	const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1));
	const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()));

	// Fetch sessions for selected month
	const { data: sessions, error: sessionsError } = await supabase
		.from('lecture_sessions')
		.select(`
			*,
			lecturer:lecturers(id, nama, gambar_url)
		`)
		.eq('bulan', month)
		.eq('tahun', year);

	if (sessionsError) {
		console.error('Error fetching sessions:', sessionsError);
	}

	// Sort sessions by minggu, then hari, then jenis_kuliah
	const sortedSessions = sessions?.sort((a, b) => {
		// Sort by minggu first
		if (a.minggu !== b.minggu) {
			return a.minggu - b.minggu;
		}
		// Then by hari (day of week)
		const dayDiff = (dayOrder[a.hari] || 99) - (dayOrder[b.hari] || 99);
		if (dayDiff !== 0) {
			return dayDiff;
		}
		// Then by jenis_kuliah
		return (lectureTypeOrder[a.jenis_kuliah] || 99) - (lectureTypeOrder[b.jenis_kuliah] || 99);
	}) || [];

	// Fetch all lecturers for dropdown
	const { data: lecturers } = await supabase
		.from('lecturers')
		.select('id, nama')
		.order('sort_order', { ascending: true })
		.order('nama', { ascending: true });

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
		lecturers: lecturers || [],
		selectedMonth: month,
		selectedYear: year,
		monthNames
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const formData = await request.formData();
		const bulan = parseInt(formData.get('bulan') as string);
		const tahun = parseInt(formData.get('tahun') as string);
		const minggu = parseInt(formData.get('minggu') as string);
		const hari = formData.get('hari') as string;
		const jenis_kuliah = formData.get('jenis_kuliah') as string;
		const lecturer_id = formData.get('lecturer_id') as string;

		if (!bulan || !tahun || !minggu || !hari || !jenis_kuliah || !lecturer_id) {
			return fail(400, { error: 'Semua medan diperlukan' });
		}

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('lecture_sessions')
			.insert({
				bulan,
				tahun,
				minggu,
				hari,
				jenis_kuliah,
				lecturer_id,
				is_active: true
			});

		if (error) {
			console.error('Error creating session:', error);
			if (error.code === '23505') {
				return fail(400, { error: 'Sesi ini sudah wujud' });
			}
			return fail(500, { error: 'Ralat semasa menambah sesi' });
		}

		return { success: true };
	},

	toggleActive: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const is_active = formData.get('is_active') === 'true';

		if (!id) {
			return fail(400, { error: 'ID sesi diperlukan' });
		}

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('lecture_sessions')
			.update({ is_active: !is_active })
			.eq('id', id);

		if (error) {
			console.error('Error toggling session:', error);
			return fail(500, { error: 'Ralat semasa mengemaskini sesi' });
		}

		return { success: true };
	},

	delete: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID sesi diperlukan' });
		}

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('lecture_sessions')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting session:', error);
			return fail(500, { error: 'Ralat semasa memadam sesi' });
		}

		return { success: true };
	}
};
