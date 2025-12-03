import { createClient } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	calculateLecturerComparison,
	type EvaluationForComparison
} from '$lib/utils/comparison';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const supabase = createClient(cookies);

	// Check authentication
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) {
		throw redirect(302, '/admin/login');
	}

	// Get selected lecturer IDs from URL params
	const selectedIds = url.searchParams.get('lecturers')?.split(',').filter(Boolean) || [];

	// Get all lecturers
	const { data: lecturers } = await supabase
		.from('lecturers')
		.select('id, nama')
		.eq('aktif', true)
		.order('nama');

	// Get filter params
	const month = url.searchParams.get('month')
		? parseInt(url.searchParams.get('month')!)
		: null;
	const year = url.searchParams.get('year')
		? parseInt(url.searchParams.get('year')!)
		: null;

	// Build evaluation query
	let query = supabase
		.from('evaluations')
		.select('lecturer_id, q1_tajuk, q2_ilmu, q3_penyampaian, q4_masa, cadangan_teruskan');

	// Apply date filters if provided
	if (month && year) {
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endMonth = month === 12 ? 1 : month + 1;
		const endYear = month === 12 ? year + 1 : year;
		const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
		query = query.gte('tarikh_penilaian', startDate).lt('tarikh_penilaian', endDate);
	}

	const { data: evaluations } = await query;

	// Calculate comparison data
	const comparisons =
		selectedIds.length > 0
			? calculateLecturerComparison(
					(evaluations || []) as EvaluationForComparison[],
					lecturers || [],
					selectedIds
				)
			: [];

	return {
		lecturers: lecturers || [],
		comparisons,
		selectedIds,
		filters: {
			month,
			year
		}
	};
};
