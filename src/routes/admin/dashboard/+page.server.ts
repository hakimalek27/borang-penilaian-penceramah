import type { PageServerLoad } from './$types';
import { createClient } from '$lib/server/supabase';
import { getLowScoreAlerts, type EvaluationForAlert } from '$lib/utils/alerts';

const monthNames = [
	'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
	'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

const DEFAULT_ALERT_THRESHOLD = 2.0;

export const load: PageServerLoad = async ({ cookies }) => {
	const supabase = createClient(cookies);
	
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	// Get total evaluations for current month
	const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
	const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
	
	const { count: totalEvaluations } = await supabase
		.from('evaluations')
		.select('*', { count: 'exact', head: true })
		.gte('tarikh_penilaian', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
		.lt('tarikh_penilaian', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

	// Get total lecturers
	const { count: totalLecturers } = await supabase
		.from('lecturers')
		.select('*', { count: 'exact', head: true });

	// Get total sessions for current month
	const { count: totalSessions } = await supabase
		.from('lecture_sessions')
		.select('*', { count: 'exact', head: true })
		.eq('bulan', currentMonth)
		.eq('tahun', currentYear);

	// Get lecturer rankings
	const { data: evaluations } = await supabase
		.from('evaluations')
		.select(`
			lecturer_id,
			q1_tajuk,
			q2_ilmu,
			q3_penyampaian,
			q4_masa,
			lecturer:lecturers(id, nama)
		`)
		.gte('tarikh_penilaian', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
		.lt('tarikh_penilaian', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

	// Calculate average scores per lecturer
	const lecturerScores: Record<string, { nama: string; total: number; count: number }> = {};

	if (evaluations) {
		for (const evaluation of evaluations) {
			if (!evaluation.lecturer_id || !evaluation.lecturer) continue;
			
			const avgScore = (evaluation.q1_tajuk + evaluation.q2_ilmu + evaluation.q3_penyampaian + evaluation.q4_masa) / 4;
			
			if (!lecturerScores[evaluation.lecturer_id]) {
				lecturerScores[evaluation.lecturer_id] = {
					nama: (evaluation.lecturer as any).nama,
					total: 0,
					count: 0
				};
			}
			
			lecturerScores[evaluation.lecturer_id].total += avgScore;
			lecturerScores[evaluation.lecturer_id].count += 1;
		}
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
	const { data: recentComments } = await supabase
		.from('evaluations')
		.select(`
			id,
			nama_penilai,
			tarikh_penilaian,
			komen_penceramah,
			cadangan_masjid,
			lecturer:lecturers(nama)
		`)
		.or('komen_penceramah.neq.,cadangan_masjid.neq.')
		.gte('tarikh_penilaian', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
		.lt('tarikh_penilaian', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`)
		.order('tarikh_penilaian', { ascending: false })
		.limit(10);

	// Get alert threshold from settings (default 2.0)
	const { data: thresholdSetting } = await supabase
		.from('settings')
		.select('value')
		.eq('key', 'alert_threshold')
		.single();
	
	const alertThreshold = thresholdSetting?.value 
		? parseFloat(String(thresholdSetting.value)) 
		: DEFAULT_ALERT_THRESHOLD;

	// Get evaluations for alerts (all time for better alert detection)
	const { data: alertEvaluations } = await supabase
		.from('evaluations')
		.select(`
			lecturer_id,
			q1_tajuk,
			q2_ilmu,
			q3_penyampaian,
			q4_masa,
			tarikh_penilaian,
			lecturer:lecturers(id, nama)
		`)
		.gte('tarikh_penilaian', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
		.lt('tarikh_penilaian', `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

	// Transform evaluations for alert calculation
	const transformedAlertEvaluations: EvaluationForAlert[] = (alertEvaluations || []).map(e => ({
		lecturer_id: e.lecturer_id,
		lecturer: Array.isArray(e.lecturer) ? e.lecturer[0] : e.lecturer,
		q1_tajuk: e.q1_tajuk,
		q2_ilmu: e.q2_ilmu,
		q3_penyampaian: e.q3_penyampaian,
		q4_masa: e.q4_masa,
		tarikh_penilaian: e.tarikh_penilaian
	}));

	// Calculate low score alerts
	const alerts = getLowScoreAlerts(transformedAlertEvaluations, alertThreshold);

	return {
		totalEvaluations: totalEvaluations || 0,
		totalLecturers: totalLecturers || 0,
		totalSessions: totalSessions || 0,
		topLecturer,
		lowestLecturer,
		recentComments: recentComments || [],
		alerts,
		alertThreshold,
		monthName: monthNames[currentMonth - 1],
		year: currentYear
	};
};
