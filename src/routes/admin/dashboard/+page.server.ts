import type { PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { getLowScoreAlerts, type EvaluationForAlert } from '$lib/utils/alerts';

const DEFAULT_ALERT_THRESHOLD = 2.0;

export const load: PageServerLoad = async () => {
	// Get total evaluations
	let totalEvaluations = 0;
	try {
		const result = await query('SELECT COUNT(*) as count FROM evaluations');
		totalEvaluations = parseInt(result.rows[0]?.count || '0');
	} catch (error) {
		console.error('Error counting evaluations:', error);
	}

	// Get total lecturers
	let totalLecturers = 0;
	try {
		const result = await query('SELECT COUNT(*) as count FROM lecturers');
		totalLecturers = parseInt(result.rows[0]?.count || '0');
	} catch (error) {
		console.error('Error counting lecturers:', error);
	}

	// Get total active sessions
	let totalSessions = 0;
	try {
		const result = await query('SELECT COUNT(*) as count FROM lecture_sessions WHERE is_active = true');
		totalSessions = parseInt(result.rows[0]?.count || '0');
	} catch (error) {
		console.error('Error counting sessions:', error);
	}

	// Get lecturer rankings with evaluations
	interface EvalRow {
		lecturer_id: string;
		q1_tajuk: number;
		q2_ilmu: number;
		q3_penyampaian: number;
		q4_masa: number;
		lecturer: { id: string; nama: string } | null;
	}
	let evaluations: EvalRow[] = [];
	try {
		const result = await query(`
			SELECT e.lecturer_id, e.q1_tajuk, e.q2_ilmu, e.q3_penyampaian, e.q4_masa,
				row_to_json(l) AS lecturer
			FROM evaluations e
			LEFT JOIN lecturers l ON l.id = e.lecturer_id
		`);
		evaluations = result.rows;
	} catch (error) {
		console.error('Error fetching evaluations:', error);
	}

	// Calculate average scores per lecturer
	const lecturerScores: Record<string, { nama: string; total: number; count: number }> = {};

	for (const evaluation of evaluations) {
		if (!evaluation.lecturer_id || !evaluation.lecturer) continue;

		const avgScore = (evaluation.q1_tajuk + evaluation.q2_ilmu + evaluation.q3_penyampaian + evaluation.q4_masa) / 4;

		if (!lecturerScores[evaluation.lecturer_id]) {
			lecturerScores[evaluation.lecturer_id] = {
				nama: evaluation.lecturer.nama,
				total: 0,
				count: 0
			};
		}

		lecturerScores[evaluation.lecturer_id].total += avgScore;
		lecturerScores[evaluation.lecturer_id].count += 1;
	}

	// Find top and lowest rated lecturers
	let topLecturer: { nama: string; avgScore: number } | null = null;
	let lowestLecturer: { nama: string; avgScore: number } | null = null;

	for (const [, data] of Object.entries(lecturerScores)) {
		const avgScore = data.total / data.count;

		if (!topLecturer || avgScore > topLecturer.avgScore) {
			topLecturer = { nama: data.nama, avgScore };
		}

		if (!lowestLecturer || avgScore < lowestLecturer.avgScore) {
			lowestLecturer = { nama: data.nama, avgScore };
		}
	}

	// Get recent comments and suggestions
	interface CommentRow {
		id: string;
		nama_penilai: string;
		tarikh_penilaian: string;
		komen_penceramah: string | null;
		cadangan_masjid: string | null;
		created_at: string;
	}
	let rawComments: CommentRow[] = [];
	try {
		const result = await query(`
			SELECT id, nama_penilai, tarikh_penilaian, komen_penceramah, cadangan_masjid, created_at
			FROM evaluations
			WHERE komen_penceramah IS NOT NULL AND komen_penceramah != ''
			   OR cadangan_masjid IS NOT NULL AND cadangan_masjid != ''
			ORDER BY created_at DESC
			LIMIT 50
		`);
		rawComments = result.rows;
	} catch (error) {
		console.error('Error fetching comments:', error);
	}

	// Remove duplicate comments/suggestions
	const seenKeys = new Set<string>();
	const recentComments: CommentRow[] = [];

	for (const item of rawComments) {
		const key = `${item.nama_penilai}-${item.tarikh_penilaian}-${item.komen_penceramah || ''}-${item.cadangan_masjid || ''}`;

		if (!seenKeys.has(key)) {
			seenKeys.add(key);
			recentComments.push(item);
			if (recentComments.length >= 10) break;
		}
	}

	// Get alert threshold from settings
	let alertThreshold = DEFAULT_ALERT_THRESHOLD;
	try {
		const result = await query(`SELECT value FROM settings WHERE key = 'alert_threshold' LIMIT 1`);
		if (result.rows[0]?.value) {
			alertThreshold = parseFloat(String(result.rows[0].value));
		}
	} catch (error) {
		console.error('Error fetching alert threshold:', error);
	}

	// Get evaluations for alerts
	interface AlertEvalRow {
		lecturer_id: string;
		q1_tajuk: number;
		q2_ilmu: number;
		q3_penyampaian: number;
		q4_masa: number;
		tarikh_penilaian: string;
		lecturer: { id: string; nama: string } | null;
	}
	let alertEvaluations: AlertEvalRow[] = [];
	try {
		const result = await query(`
			SELECT e.lecturer_id, e.q1_tajuk, e.q2_ilmu, e.q3_penyampaian, e.q4_masa, e.tarikh_penilaian,
				row_to_json(l) AS lecturer
			FROM evaluations e
			LEFT JOIN lecturers l ON l.id = e.lecturer_id
		`);
		alertEvaluations = result.rows;
	} catch (error) {
		console.error('Error fetching alert evaluations:', error);
	}

	// Transform evaluations for alert calculation
	const transformedAlertEvaluations: EvaluationForAlert[] = alertEvaluations.map(e => ({
		lecturer_id: e.lecturer_id,
		lecturer: e.lecturer,
		q1_tajuk: e.q1_tajuk,
		q2_ilmu: e.q2_ilmu,
		q3_penyampaian: e.q3_penyampaian,
		q4_masa: e.q4_masa,
		tarikh_penilaian: e.tarikh_penilaian
	}));

	// Calculate low score alerts
	const alerts = getLowScoreAlerts(transformedAlertEvaluations, alertThreshold);

	return {
		totalEvaluations,
		totalLecturers,
		totalSessions,
		topLecturer,
		lowestLecturer,
		recentComments,
		alerts,
		alertThreshold
	};
};
