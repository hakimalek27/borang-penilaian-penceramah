/**
 * Comparison utility functions for lecturer comparison feature
 */

export interface EvaluationForComparison {
	lecturer_id: string;
	q1_tajuk: number;
	q2_ilmu: number;
	q3_penyampaian: number;
	q4_masa: number;
	cadangan_teruskan: boolean;
}

export interface LecturerComparison {
	lecturerId: string;
	lecturerName: string;
	avgQ1: number;
	avgQ2: number;
	avgQ3: number;
	avgQ4: number;
	avgOverall: number;
	recommendationYesPercent: number;
	recommendationNoPercent: number;
	totalEvaluations: number;
}

export interface LecturerInfo {
	id: string;
	nama: string;
}

/**
 * Calculate comparison data for multiple lecturers
 * @param evaluations - Array of evaluations
 * @param lecturers - Array of lecturer info
 * @param lecturerIds - Array of lecturer IDs to compare
 * @returns Array of comparison data for each lecturer
 */
export function calculateLecturerComparison(
	evaluations: EvaluationForComparison[],
	lecturers: LecturerInfo[],
	lecturerIds: string[]
): LecturerComparison[] {
	const lecturerMap = new Map(lecturers.map(l => [l.id, l.nama]));
	
	return lecturerIds.map(lecturerId => {
		const lecturerEvals = evaluations.filter(e => e.lecturer_id === lecturerId);
		const totalEvaluations = lecturerEvals.length;
		
		if (totalEvaluations === 0) {
			return {
				lecturerId,
				lecturerName: lecturerMap.get(lecturerId) || 'Unknown',
				avgQ1: 0,
				avgQ2: 0,
				avgQ3: 0,
				avgQ4: 0,
				avgOverall: 0,
				recommendationYesPercent: 0,
				recommendationNoPercent: 0,
				totalEvaluations: 0
			};
		}

		const sumQ1 = lecturerEvals.reduce((sum, e) => sum + e.q1_tajuk, 0);
		const sumQ2 = lecturerEvals.reduce((sum, e) => sum + e.q2_ilmu, 0);
		const sumQ3 = lecturerEvals.reduce((sum, e) => sum + e.q3_penyampaian, 0);
		const sumQ4 = lecturerEvals.reduce((sum, e) => sum + e.q4_masa, 0);
		
		const avgQ1 = sumQ1 / totalEvaluations;
		const avgQ2 = sumQ2 / totalEvaluations;
		const avgQ3 = sumQ3 / totalEvaluations;
		const avgQ4 = sumQ4 / totalEvaluations;
		const avgOverall = (avgQ1 + avgQ2 + avgQ3 + avgQ4) / 4;
		
		const yesCount = lecturerEvals.filter(e => e.cadangan_teruskan).length;
		const recommendationYesPercent = (yesCount / totalEvaluations) * 100;
		const recommendationNoPercent = 100 - recommendationYesPercent;
		
		return {
			lecturerId,
			lecturerName: lecturerMap.get(lecturerId) || 'Unknown',
			avgQ1: Number(avgQ1.toFixed(2)),
			avgQ2: Number(avgQ2.toFixed(2)),
			avgQ3: Number(avgQ3.toFixed(2)),
			avgQ4: Number(avgQ4.toFixed(2)),
			avgOverall: Number(avgOverall.toFixed(2)),
			recommendationYesPercent: Number(recommendationYesPercent.toFixed(1)),
			recommendationNoPercent: Number(recommendationNoPercent.toFixed(1)),
			totalEvaluations
		};
	});
}

/**
 * Get comparison labels for chart display
 */
export function getComparisonLabels(): string[] {
	return ['Tajuk', 'Ilmu', 'Penyampaian', 'Masa'];
}

/**
 * Get comparison values for a lecturer (for chart)
 */
export function getComparisonValues(comparison: LecturerComparison): number[] {
	return [comparison.avgQ1, comparison.avgQ2, comparison.avgQ3, comparison.avgQ4];
}

/**
 * Generate chart colors for comparison
 */
export function getComparisonColors(count: number): string[] {
	const colors = [
		'rgba(59, 130, 246, 0.8)',   // Blue
		'rgba(16, 185, 129, 0.8)',   // Green
		'rgba(245, 158, 11, 0.8)',   // Amber
		'rgba(239, 68, 68, 0.8)',    // Red
		'rgba(139, 92, 246, 0.8)',   // Purple
		'rgba(236, 72, 153, 0.8)',   // Pink
		'rgba(20, 184, 166, 0.8)',   // Teal
		'rgba(249, 115, 22, 0.8)'    // Orange
	];
	return colors.slice(0, count);
}
