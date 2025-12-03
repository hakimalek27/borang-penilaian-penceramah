/**
 * Alert System Utility
 * Detects lecturers with low evaluation scores
 */

export interface LecturerAlert {
	lecturerId: string;
	lecturerName: string;
	averageScore: number;
	evaluationCount: number;
	lastEvaluationDate: string | null;
}

export interface EvaluationForAlert {
	lecturer_id: string | null;
	lecturer?: { id: string; nama: string } | null;
	q1_tajuk: number;
	q2_ilmu: number;
	q3_penyampaian: number;
	q4_masa: number;
	tarikh_penilaian: string;
}

const DEFAULT_THRESHOLD = 2.0;

/**
 * Calculate average score for a single evaluation
 */
export function calculateEvaluationAverage(evaluation: EvaluationForAlert): number {
	return (
		evaluation.q1_tajuk +
		evaluation.q2_ilmu +
		evaluation.q3_penyampaian +
		evaluation.q4_masa
	) / 4;
}

/**
 * Get lecturers with average scores below threshold
 * @param evaluations - Array of evaluation records
 * @param threshold - Score threshold (default 2.0)
 * @returns Array of lecturer alerts
 */
export function getLowScoreAlerts(
	evaluations: EvaluationForAlert[],
	threshold: number = DEFAULT_THRESHOLD
): LecturerAlert[] {
	// Validate threshold
	const validThreshold = Math.max(1, Math.min(4, threshold));

	// Group evaluations by lecturer
	const lecturerEvaluations = new Map<string, {
		name: string;
		scores: number[];
		lastDate: string | null;
	}>();

	for (const evaluation of evaluations) {
		if (!evaluation.lecturer_id || !evaluation.lecturer) continue;

		const lecturerId = evaluation.lecturer_id;
		const lecturerName = evaluation.lecturer.nama;
		const score = calculateEvaluationAverage(evaluation);

		if (!lecturerEvaluations.has(lecturerId)) {
			lecturerEvaluations.set(lecturerId, {
				name: lecturerName,
				scores: [],
				lastDate: null
			});
		}

		const data = lecturerEvaluations.get(lecturerId)!;
		data.scores.push(score);

		// Track latest evaluation date
		if (!data.lastDate || evaluation.tarikh_penilaian > data.lastDate) {
			data.lastDate = evaluation.tarikh_penilaian;
		}
	}

	// Find lecturers below threshold
	const alerts: LecturerAlert[] = [];

	for (const [lecturerId, data] of lecturerEvaluations) {
		if (data.scores.length === 0) continue;

		const averageScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;

		if (averageScore < validThreshold) {
			alerts.push({
				lecturerId,
				lecturerName: data.name,
				averageScore,
				evaluationCount: data.scores.length,
				lastEvaluationDate: data.lastDate
			});
		}
	}

	// Sort by average score (lowest first)
	alerts.sort((a, b) => a.averageScore - b.averageScore);

	return alerts;
}

/**
 * Check if a specific lecturer has low score alert
 */
export function hasLowScoreAlert(
	evaluations: EvaluationForAlert[],
	lecturerId: string,
	threshold: number = DEFAULT_THRESHOLD
): boolean {
	const alerts = getLowScoreAlerts(evaluations, threshold);
	return alerts.some(alert => alert.lecturerId === lecturerId);
}

/**
 * Get alert severity based on score
 */
export function getAlertSeverity(averageScore: number): 'critical' | 'warning' | 'none' {
	if (averageScore < 1.5) return 'critical';
	if (averageScore < 2.0) return 'warning';
	return 'none';
}

/**
 * Format alert message
 */
export function formatAlertMessage(alert: LecturerAlert): string {
	const severity = getAlertSeverity(alert.averageScore);
	const prefix = severity === 'critical' ? '⚠️ Kritikal' : '⚡ Amaran';
	return `${prefix}: ${alert.lecturerName} mempunyai purata skor ${alert.averageScore.toFixed(2)}/4.00 (${alert.evaluationCount} penilaian)`;
}

/**
 * Validate alert data structure
 */
export function validateAlertData(alert: unknown): alert is LecturerAlert {
	if (!alert || typeof alert !== 'object') return false;
	
	const a = alert as Record<string, unknown>;
	
	return (
		typeof a.lecturerId === 'string' &&
		typeof a.lecturerName === 'string' &&
		typeof a.averageScore === 'number' &&
		typeof a.evaluationCount === 'number'
	);
}
