import type { Evaluation, LecturerScore, ReportFilters } from '$lib/types/database';

/**
 * Calculates average scores per lecturer from evaluations
 */
export function calculateLecturerScores(
	evaluations: Evaluation[],
	lecturerNames: Record<string, string>
): LecturerScore[] {
	const scores: Record<string, {
		total: { q1: number; q2: number; q3: number; q4: number };
		count: number;
	}> = {};

	for (const evaluation of evaluations) {
		if (!evaluation.lecturer_id) continue;

		if (!scores[evaluation.lecturer_id]) {
			scores[evaluation.lecturer_id] = {
				total: { q1: 0, q2: 0, q3: 0, q4: 0 },
				count: 0
			};
		}

		scores[evaluation.lecturer_id].total.q1 += evaluation.q1_tajuk;
		scores[evaluation.lecturer_id].total.q2 += evaluation.q2_ilmu;
		scores[evaluation.lecturer_id].total.q3 += evaluation.q3_penyampaian;
		scores[evaluation.lecturer_id].total.q4 += evaluation.q4_masa;
		scores[evaluation.lecturer_id].count += 1;
	}

	return Object.entries(scores).map(([lecturerId, data]) => {
		const avgQ1 = data.total.q1 / data.count;
		const avgQ2 = data.total.q2 / data.count;
		const avgQ3 = data.total.q3 / data.count;
		const avgQ4 = data.total.q4 / data.count;
		const avgOverall = (avgQ1 + avgQ2 + avgQ3 + avgQ4) / 4;

		return {
			lecturerId,
			lecturerName: lecturerNames[lecturerId] || 'Unknown',
			avgQ1,
			avgQ2,
			avgQ3,
			avgQ4,
			avgOverall,
			totalEvaluations: data.count
		};
	}).sort((a, b) => b.avgOverall - a.avgOverall);
}

/**
 * Calculates recommendation distribution (Ya/Tidak)
 */
export function calculateRecommendationStats(
	evaluations: Evaluation[]
): { ya: number; tidak: number } {
	let ya = 0;
	let tidak = 0;

	for (const evaluation of evaluations) {
		if (evaluation.cadangan_teruskan) {
			ya++;
		} else {
			tidak++;
		}
	}

	return { ya, tidak };
}

/**
 * Counts evaluations per lecturer
 */
export function countEvaluationsPerLecturer(
	evaluations: Evaluation[]
): Record<string, number> {
	const counts: Record<string, number> = {};

	for (const evaluation of evaluations) {
		if (!evaluation.lecturer_id) continue;
		counts[evaluation.lecturer_id] = (counts[evaluation.lecturer_id] || 0) + 1;
	}

	return counts;
}

/**
 * Calculates average score for a specific question
 */
export function calculateQuestionAverage(
	evaluations: Evaluation[],
	question: 'q1_tajuk' | 'q2_ilmu' | 'q3_penyampaian' | 'q4_masa'
): number {
	if (evaluations.length === 0) return 0;

	const total = evaluations.reduce((sum, e) => sum + e[question], 0);
	return total / evaluations.length;
}

/**
 * Filters evaluations based on criteria
 */
export function filterEvaluations(
	evaluations: Evaluation[],
	filters: Partial<ReportFilters>
): Evaluation[] {
	return evaluations.filter(evaluation => {
		// Filter by lecturer
		if (filters.lecturerId && evaluation.lecturer_id !== filters.lecturerId) {
			return false;
		}

		// Filter by week (requires session data)
		if (filters.week && evaluation.session?.minggu !== filters.week) {
			return false;
		}

		// Filter by lecture type
		if (filters.lectureType && evaluation.session?.jenis_kuliah !== filters.lectureType) {
			return false;
		}

		return true;
	});
}

/**
 * Gets top N lecturers by average score
 */
export function getTopLecturers(scores: LecturerScore[], n: number): LecturerScore[] {
	return scores.slice(0, n);
}

/**
 * Gets bottom N lecturers by average score
 */
export function getBottomLecturers(scores: LecturerScore[], n: number): LecturerScore[] {
	return [...scores].sort((a, b) => a.avgOverall - b.avgOverall).slice(0, n);
}
