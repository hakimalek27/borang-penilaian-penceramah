import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import { calculateLecturerScores, calculateRecommendationStats } from '$lib/utils/calculations';
import type { Evaluation } from '$lib/types/database';

const monthNames = [
	'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
	'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createClient(cookies);
	
	const now = new Date();
	const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1));
	const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()));
	const week = url.searchParams.get('week') ? parseInt(url.searchParams.get('week')!) : null;
	const lecturerId = url.searchParams.get('lecturer') || null;
	const lectureType = url.searchParams.get('type') as 'Subuh' | 'Maghrib' | null;

	// Build query for evaluations
	let query = supabase
		.from('evaluations')
		.select(`
			*,
			session:lecture_sessions(id, minggu, hari, jenis_kuliah),
			lecturer:lecturers(id, nama)
		`)
		.gte('tarikh_penilaian', `${year}-${String(month).padStart(2, '0')}-01`)
		.lt('tarikh_penilaian', month === 12 
			? `${year + 1}-01-01` 
			: `${year}-${String(month + 1).padStart(2, '0')}-01`);

	if (lecturerId) {
		query = query.eq('lecturer_id', lecturerId);
	}

	const { data: evaluations, error } = await query.order('tarikh_penilaian', { ascending: false });

	if (error) {
		console.error('Error fetching evaluations:', error);
	}

	// Filter by week and lecture type (requires session data)
	let filteredEvaluations = (evaluations || []) as Evaluation[];
	
	if (week) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.minggu === week);
	}
	
	if (lectureType) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.jenis_kuliah === lectureType);
	}

	// Get all lecturers for filter dropdown (include gambar_url for individual report)
	const { data: lecturers } = await supabase
		.from('lecturers')
		.select('id, nama, gambar_url')
		.order('nama');

	// Get lecturer sessions/schedule for individual report (include minggu)
	const { data: lecturerSessions } = await supabase
		.from('lecture_sessions')
		.select('lecturer_id, minggu, hari, jenis_kuliah')
		.eq('bulan', month)
		.eq('tahun', year)
		.eq('is_active', true)
		.order('minggu', { ascending: true });

	// Create lecturer names map
	const lecturerNames: Record<string, string> = {};
	for (const l of lecturers || []) {
		lecturerNames[l.id] = l.nama;
	}

	// Calculate scores and stats
	const lecturerScores = calculateLecturerScores(filteredEvaluations, lecturerNames);
	const recommendationStats = calculateRecommendationStats(filteredEvaluations);

	return {
		evaluations: filteredEvaluations,
		lecturerScores,
		recommendationStats,
		lecturers: lecturers || [],
		lecturerSessions: lecturerSessions || [],
		filters: {
			month,
			year,
			week,
			lecturerId,
			lectureType
		},
		monthNames
	};
};

export const actions: Actions = {
	deleteEvaluation: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID penilaian diperlukan' });
		}

		const supabase = createClient(cookies);

		const { error } = await supabase
			.from('evaluations')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting evaluation:', error);
			return fail(500, { error: 'Ralat semasa memadam penilaian' });
		}

		return { success: true };
	}
};
