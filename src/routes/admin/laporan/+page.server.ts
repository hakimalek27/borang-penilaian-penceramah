import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { calculateLecturerScores } from '$lib/utils/calculations';
import type { Evaluation } from '$lib/types/database';

export const load: PageServerLoad = async ({ url }) => {
	// Get filter params - date range based
	const dateFrom = url.searchParams.get('from') || null;
	const dateTo = url.searchParams.get('to') || null;
	const week = url.searchParams.get('week') ? parseInt(url.searchParams.get('week')!) : null;
	const lecturerId = url.searchParams.get('lecturer') || null;
	const lectureType = url.searchParams.get('type') as 'Subuh' | 'Maghrib' | 'Tazkirah Jumaat' | null;

	// Build query for evaluations with joins
	let evalSql = `
		SELECT e.*,
			row_to_json(s) AS session,
			row_to_json(l) AS lecturer
		FROM evaluations e
		LEFT JOIN lecture_sessions s ON s.id = e.session_id
		LEFT JOIN lecturers l ON l.id = e.lecturer_id
		WHERE 1=1
	`;
	const evalParams: unknown[] = [];
	let paramIndex = 1;

	if (dateFrom) {
		evalSql += ` AND e.tarikh_penilaian >= $${paramIndex}`;
		evalParams.push(dateFrom);
		paramIndex++;
	}
	if (dateTo) {
		evalSql += ` AND e.tarikh_penilaian <= $${paramIndex}`;
		evalParams.push(dateTo);
		paramIndex++;
	}
	if (lecturerId) {
		evalSql += ` AND e.lecturer_id = $${paramIndex}`;
		evalParams.push(lecturerId);
		paramIndex++;
	}

	evalSql += ` ORDER BY e.tarikh_penilaian DESC`;

	let evaluations: Evaluation[] = [];
	try {
		const evalResult = await query(evalSql, evalParams);
		evaluations = evalResult.rows as Evaluation[];
	} catch (error) {
		console.error('Error fetching evaluations:', error);
	}

	// Filter by week and lecture type (client-side filter for joined data)
	let filteredEvaluations = evaluations;

	if (week) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.minggu === week);
	}

	if (lectureType) {
		filteredEvaluations = filteredEvaluations.filter(e => e.session?.jenis_kuliah === lectureType);
	}

	// Get all lecturers for filter dropdown
	let lecturers: { id: string; nama: string; gambar_url: string | null }[] = [];
	try {
		const lecturersResult = await query(`
			SELECT id, nama, gambar_url FROM lecturers ORDER BY nama
		`);
		lecturers = lecturersResult.rows;
	} catch (error) {
		console.error('Error fetching lecturers:', error);
	}

	// Get lecturer sessions/schedule for individual report
	let lecturerSessions: { lecturer_id: string; minggu: number; hari: string; jenis_kuliah: string }[] = [];
	try {
		const sessionsResult = await query(`
			SELECT lecturer_id, minggu, hari, jenis_kuliah
			FROM lecture_sessions
			WHERE is_active = true
			ORDER BY minggu ASC
		`);
		lecturerSessions = sessionsResult.rows;
	} catch (error) {
		console.error('Error fetching sessions:', error);
	}

	// Create lecturer names map
	const lecturerNames: Record<string, string> = {};
	for (const l of lecturers) {
		lecturerNames[l.id] = l.nama;
	}

	// Calculate scores
	const lecturerScores = calculateLecturerScores(filteredEvaluations, lecturerNames);

	return {
		evaluations: filteredEvaluations,
		lecturerScores,
		lecturers,
		lecturerSessions,
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
	deleteEvaluation: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID penilaian diperlukan' });
		}

		try {
			await query('DELETE FROM evaluations WHERE id = $1', [id]);
			return { success: true };
		} catch (error) {
			console.error('Error deleting evaluation:', error);
			return fail(500, { error: 'Ralat semasa memadam penilaian' });
		}
	}
};
