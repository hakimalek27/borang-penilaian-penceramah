import { query } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import {
	calculateLecturerComparison,
	type EvaluationForComparison
} from '$lib/utils/comparison';

export const load: PageServerLoad = async ({ url }) => {
	// Get selected lecturer IDs from URL params
	const selectedIds = url.searchParams.get('lecturers')?.split(',').filter(Boolean) || [];

	// Get filter params
	const month = url.searchParams.get('month')
		? parseInt(url.searchParams.get('month')!)
		: null;
	const year = url.searchParams.get('year')
		? parseInt(url.searchParams.get('year')!)
		: null;

	// Get all lecturers
	let lecturers: { id: string; nama: string }[] = [];
	try {
		const lecturersResult = await query(`
			SELECT id, nama FROM lecturers WHERE aktif = true ORDER BY nama
		`);
		lecturers = lecturersResult.rows;
	} catch (error) {
		console.error('Error fetching lecturers:', error);
	}

	// Build evaluation query
	let evalSql = `
		SELECT lecturer_id, q1_tajuk, q2_ilmu, q3_penyampaian, q4_masa
		FROM evaluations
		WHERE 1=1
	`;
	const evalParams: unknown[] = [];
	let paramIndex = 1;

	// Apply date filters if provided
	if (month && year) {
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endMonth = month === 12 ? 1 : month + 1;
		const endYear = month === 12 ? year + 1 : year;
		const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
		evalSql += ` AND tarikh_penilaian >= $${paramIndex} AND tarikh_penilaian < $${paramIndex + 1}`;
		evalParams.push(startDate, endDate);
	}

	let evaluations: EvaluationForComparison[] = [];
	try {
		const evalResult = await query(evalSql, evalParams);
		evaluations = evalResult.rows as EvaluationForComparison[];
	} catch (error) {
		console.error('Error fetching evaluations:', error);
	}

	// Calculate comparison data
	const comparisons =
		selectedIds.length > 0
			? calculateLecturerComparison(evaluations, lecturers, selectedIds)
			: [];

	return {
		lecturers,
		comparisons,
		selectedIds,
		filters: {
			month,
			year
		}
	};
};
