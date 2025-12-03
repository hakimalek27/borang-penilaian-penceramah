/**
 * Trend Calculation Utility
 * Calculates monthly evaluation trends for dashboard
 */

export interface TrendData {
	month: number;
	year: number;
	label: string;
	averageScore: number | null;
	evaluationCount: number;
}

export interface EvaluationForTrend {
	tarikh_penilaian: string;
	lecturer_id: string | null;
	q1_tajuk: number;
	q2_ilmu: number;
	q3_penyampaian: number;
	q4_masa: number;
}

const MONTH_NAMES = [
	'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
	'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
];

/**
 * Calculate monthly trend data from evaluations
 * @param evaluations - Array of evaluation records
 * @param months - Number of months to include (default 6)
 * @param lecturerId - Optional filter by lecturer
 * @returns Array of trend data points
 */
export function calculateMonthlyTrend(
	evaluations: EvaluationForTrend[],
	months: number = 6,
	lecturerId?: string
): TrendData[] {
	// Filter by lecturer if specified
	const filtered = lecturerId
		? evaluations.filter(e => e.lecturer_id === lecturerId)
		: evaluations;

	// Get current date and calculate start date
	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	// Generate month slots for the past N months
	const trendData: TrendData[] = [];
	
	for (let i = months - 1; i >= 0; i--) {
		let month = currentMonth - i;
		let year = currentYear;
		
		// Handle year rollover
		while (month < 0) {
			month += 12;
			year -= 1;
		}

		const label = `${MONTH_NAMES[month]} ${year}`;
		
		// Find evaluations for this month
		const monthEvaluations = filtered.filter(e => {
			const date = new Date(e.tarikh_penilaian);
			return date.getMonth() === month && date.getFullYear() === year;
		});

		// Calculate average score for this month
		let averageScore: number | null = null;
		if (monthEvaluations.length > 0) {
			const totalScore = monthEvaluations.reduce((sum, e) => {
				const evalAvg = (e.q1_tajuk + e.q2_ilmu + e.q3_penyampaian + e.q4_masa) / 4;
				return sum + evalAvg;
			}, 0);
			averageScore = totalScore / monthEvaluations.length;
		}

		trendData.push({
			month: month + 1, // 1-indexed
			year,
			label,
			averageScore,
			evaluationCount: monthEvaluations.length
		});
	}

	return trendData;
}

/**
 * Filter trend data by lecturer
 * @param evaluations - Array of evaluation records
 * @param lecturerId - Lecturer ID to filter by
 * @param months - Number of months
 * @returns Filtered trend data
 */
export function getTrendByLecturer(
	evaluations: EvaluationForTrend[],
	lecturerId: string,
	months: number = 6
): TrendData[] {
	return calculateMonthlyTrend(evaluations, months, lecturerId);
}

/**
 * Check if trend data handles missing months correctly
 * Missing months should have null averageScore and 0 evaluationCount
 */
export function validateTrendData(trendData: TrendData[]): boolean {
	return trendData.every(point => {
		// If no evaluations, averageScore should be null
		if (point.evaluationCount === 0) {
			return point.averageScore === null;
		}
		// If has evaluations, averageScore should be between 1 and 4
		return point.averageScore !== null && 
			point.averageScore >= 1 && 
			point.averageScore <= 4;
	});
}

/**
 * Get trend labels for chart
 */
export function getTrendLabels(trendData: TrendData[]): string[] {
	return trendData.map(d => d.label);
}

/**
 * Get trend values for chart (null values become 0 for display)
 */
export function getTrendValues(trendData: TrendData[]): (number | null)[] {
	return trendData.map(d => d.averageScore);
}

/**
 * Calculate trend direction (improving, declining, stable)
 */
export function getTrendDirection(trendData: TrendData[]): 'improving' | 'declining' | 'stable' | 'insufficient' {
	// Filter out null values
	const validPoints = trendData.filter(d => d.averageScore !== null);
	
	if (validPoints.length < 2) {
		return 'insufficient';
	}

	const firstHalf = validPoints.slice(0, Math.floor(validPoints.length / 2));
	const secondHalf = validPoints.slice(Math.floor(validPoints.length / 2));

	const firstAvg = firstHalf.reduce((sum, d) => sum + (d.averageScore || 0), 0) / firstHalf.length;
	const secondAvg = secondHalf.reduce((sum, d) => sum + (d.averageScore || 0), 0) / secondHalf.length;

	const diff = secondAvg - firstAvg;
	
	if (diff > 0.1) return 'improving';
	if (diff < -0.1) return 'declining';
	return 'stable';
}
