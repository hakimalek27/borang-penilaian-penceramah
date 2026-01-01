import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import { calculateLecturerScores } from '$lib/utils/calculations';
import type { Evaluation } from '$lib/types/database';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createClient(cookies);

	// Get filter params - date range based
	const dateFrom = url.searchParams.get('from') || null;
	const dateTo = url.searchParams.get('to') || null;
	const week = url.searchParams.get('week') ? parseInt(url.searchParams.get('week')!) : null;
	const lecturerId = url.searchParams.get('lecturer') || null;
	const lectureType = url.searchParams.get('type') as 'Subuh' | 'Maghrib' | 'Tazkirah Jumaat' | null;

	// Build query for evaluations
	let query = supabase
		.from('evaluations')
		.select(`
			*,
			session:lecture_sessions(id, minggu, hari, jenis_kuliah),
			lecturer:lecturers(id, nama)
		`);

	// Apply date range filter if provided
	if (dateFrom) {
		query = query.gte('tarikh_penilaian', dateFrom);
	}
	if (dateTo) {
		query = query.lte('tarikh_penilaian', dateTo);
	}

	if (lecturerId) {
		query = query.eq('lecturer_id', lecturerId);
	}

	const { data: evaluations, error } = await query.order('tarikh_penilaian', { ascending: false });

	if (error) {
		console.error('Error fetching evaluations:', error);
	}

	// Filter by week and lecture type
	let filteredEvaluations = (evaluations || []) as Evaluation[];

	if (week) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.minggu === week);
	}

	if (lectureType) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.jenis_kuliah === lectureType);
	}

	// Get all lecturers for filter dropdown
	const { data: lecturers } = await supabase
		.from('lecturers')
		.select('id, nama, gambar_url')
		.order('nama');

	// Get lecturer sessions/schedule for individual report (all active sessions)
	const { data: lecturerSessions } = await supabase
		.from('lecture_sessions')
		.select('lecturer_id, minggu, hari, jenis_kuliah')
		.eq('is_active', true)
		.order('minggu', { ascending: true });

	// Create lecturer names map
	const lecturerNames: Record<string, string> = {};
	for (const l of lecturers || []) {
		lecturerNames[l.id] = l.nama;
	}

	// Calculate scores
	const lecturerScores = calculateLecturerScores(filteredEvaluations, lecturerNames);

	return {
		evaluations: filteredEvaluations,
		lecturerScores,
		lecturers: lecturers || [],
		lecturerSessions: lecturerSessions || [],
		filters: {
			dateFrom,
			dateTo,
			week,
			lecturerId,
			lectureType
		}
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
