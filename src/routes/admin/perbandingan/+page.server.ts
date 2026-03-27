import { query } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import {
	calculateLecturerComparison,
	type EvaluationForComparison
} from '$lib/utils/comparison';

export const load: PageServerLoad = async ({ url }) => {
	// Get selected lecturer IDs from URL params
	const selectedIds = url.searchParams.get('lecturers')?.split(',').filter(Boolean) || [];

	// Get all lecturers
	let lecturers: { id: string; nama: string }[] = [];
	try {
		const lecturersResult = await query(`
			SELECT id, nama FROM lecturers ORDER BY nama
		`);
		lecturers = lecturersResult.rows;
	} catch (error) {
		console.error('Error fetching lecturers:', error);
	}

	// Get all evaluations (no date filter)
	let evaluations: EvaluationForComparison[] = [];
	try {
		const evalResult = await query(`
			SELECT lecturer_id, q1_tajuk, q2_ilmu, q3_penyampaian, q4_masa
			FROM evaluations
		`);
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
		selectedIds
	};
};
