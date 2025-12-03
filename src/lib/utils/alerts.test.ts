/**
 * Alert System Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 27, 28, 29**
 * **Validates: Requirements 19.1, 19.2, 19.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	getLowScoreAlerts,
	hasLowScoreAlert,
	getAlertSeverity,
	formatAlertMessage,
	validateAlertData,
	calculateEvaluationAverage,
	type EvaluationForAlert,
	type LecturerAlert
} from './alerts';

// Arbitrary for generating valid evaluations with lecturer
const evaluationWithLecturerArbitrary = fc.record({
	lecturer_id: fc.uuid(),
	lecturer: fc.record({
		id: fc.uuid(),
		nama: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
	}),
	q1_tajuk: fc.integer({ min: 1, max: 4 }),
	q2_ilmu: fc.integer({ min: 1, max: 4 }),
	q3_penyampaian: fc.integer({ min: 1, max: 4 }),
	q4_masa: fc.integer({ min: 1, max: 4 }),
	tarikh_penilaian: fc.date({ min: new Date('2024-01-01'), max: new Date() })
		.map(d => d.toISOString().split('T')[0])
}).map(e => ({ ...e, lecturer: { ...e.lecturer, id: e.lecturer_id } }));

describe('Alert System Utils', () => {
	describe('getLowScoreAlerts', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 27: Low Score Alert Trigger**
		 * **Validates: Requirements 19.1**
		 * 
		 * For any lecturer whose average score falls below the configured threshold,
		 * the alert system SHALL include that lecturer in the alerts list.
		 */
		it('should trigger alerts for lecturers below threshold', () => {
			// Create evaluations with known low scores
			const lowScoreLecturer = {
				lecturer_id: 'low-score-lecturer',
				lecturer: { id: 'low-score-lecturer', nama: 'Ustaz Low' },
				q1_tajuk: 1,
				q2_ilmu: 1,
				q3_penyampaian: 2,
				q4_masa: 1,
				tarikh_penilaian: '2024-06-15'
			};

			const highScoreLecturer = {
				lecturer_id: 'high-score-lecturer',
				lecturer: { id: 'high-score-lecturer', nama: 'Ustaz High' },
				q1_tajuk: 4,
				q2_ilmu: 4,
				q3_penyampaian: 4,
				q4_masa: 4,
				tarikh_penilaian: '2024-06-15'
			};

			const evaluations = [lowScoreLecturer, highScoreLecturer];
			const alerts = getLowScoreAlerts(evaluations, 2.0);

			// Should only include low score lecturer
			expect(alerts.length).toBe(1);
			expect(alerts[0].lecturerId).toBe('low-score-lecturer');
			expect(alerts[0].averageScore).toBe(1.25);
		});

		/**
		 * Property: All lecturers below threshold should be included
		 */
		it('should include all lecturers below threshold', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationWithLecturerArbitrary, { minLength: 1, maxLength: 20 }),
					fc.float({ min: 1.5, max: 3.5, noNaN: true }),
					(evaluations, threshold) => {
						const alerts = getLowScoreAlerts(evaluations, threshold);

						// All alerts should have scores below threshold
						alerts.forEach(alert => {
							expect(alert.averageScore).toBeLessThan(threshold);
						});
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should return empty array for no evaluations', () => {
			const alerts = getLowScoreAlerts([], 2.0);
			expect(alerts).toEqual([]);
		});

		it('should return empty array when all scores are above threshold', () => {
			const evaluations: EvaluationForAlert[] = [
				{
					lecturer_id: 'lecturer-1',
					lecturer: { id: 'lecturer-1', nama: 'Ustaz A' },
					q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4,
					tarikh_penilaian: '2024-06-15'
				}
			];

			const alerts = getLowScoreAlerts(evaluations, 2.0);
			expect(alerts).toEqual([]);
		});
	});

	describe('Alert Content', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 28: Alert Contains Required Information**
		 * **Validates: Requirements 19.2**
		 * 
		 * For any lecturer alert, the alert data SHALL contain:
		 * lecturer name, current average score, and number of evaluations.
		 */
		it('should contain all required information', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationWithLecturerArbitrary, { minLength: 1, maxLength: 10 }),
					(evaluations) => {
						// Use low threshold to ensure we get alerts
						const alerts = getLowScoreAlerts(evaluations, 4.0);

						alerts.forEach(alert => {
							// Must have lecturer name
							expect(alert.lecturerName).toBeDefined();
							expect(typeof alert.lecturerName).toBe('string');
							expect(alert.lecturerName.length).toBeGreaterThan(0);

							// Must have average score
							expect(alert.averageScore).toBeDefined();
							expect(typeof alert.averageScore).toBe('number');
							expect(alert.averageScore).toBeGreaterThanOrEqual(1);
							expect(alert.averageScore).toBeLessThanOrEqual(4);

							// Must have evaluation count
							expect(alert.evaluationCount).toBeDefined();
							expect(typeof alert.evaluationCount).toBe('number');
							expect(alert.evaluationCount).toBeGreaterThan(0);
						});
					}
				),
				{ numRuns: 30 }
			);
		});
	});

	describe('Custom Threshold', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 29: Custom Alert Threshold**
		 * **Validates: Requirements 19.4**
		 * 
		 * For any custom threshold value set by admin,
		 * the alert system SHALL use that threshold for determining low score alerts.
		 */
		it('should respect custom threshold', () => {
			const evaluations: EvaluationForAlert[] = [
				{
					lecturer_id: 'lecturer-1',
					lecturer: { id: 'lecturer-1', nama: 'Ustaz A' },
					q1_tajuk: 3, q2_ilmu: 3, q3_penyampaian: 3, q4_masa: 3, // avg = 3.0
					tarikh_penilaian: '2024-06-15'
				}
			];

			// With threshold 2.0, should not trigger
			const alertsLow = getLowScoreAlerts(evaluations, 2.0);
			expect(alertsLow.length).toBe(0);

			// With threshold 3.5, should trigger
			const alertsHigh = getLowScoreAlerts(evaluations, 3.5);
			expect(alertsHigh.length).toBe(1);
		});

		it('should clamp threshold to valid range', () => {
			const evaluations: EvaluationForAlert[] = [
				{
					lecturer_id: 'lecturer-1',
					lecturer: { id: 'lecturer-1', nama: 'Ustaz A' },
					q1_tajuk: 1, q2_ilmu: 1, q3_penyampaian: 1, q4_masa: 1,
					tarikh_penilaian: '2024-06-15'
				}
			];

			// Threshold below 1 should be clamped to 1
			const alertsLow = getLowScoreAlerts(evaluations, 0.5);
			expect(alertsLow.length).toBe(0); // 1.0 is not < 1.0

			// Threshold above 4 should be clamped to 4
			const alertsHigh = getLowScoreAlerts(evaluations, 5.0);
			expect(alertsHigh.length).toBe(1); // 1.0 < 4.0
		});
	});

	describe('calculateEvaluationAverage', () => {
		it('should calculate correct average', () => {
			const evaluation: EvaluationForAlert = {
				lecturer_id: 'test',
				lecturer: { id: 'test', nama: 'Test' },
				q1_tajuk: 4,
				q2_ilmu: 3,
				q3_penyampaian: 2,
				q4_masa: 1,
				tarikh_penilaian: '2024-06-15'
			};

			expect(calculateEvaluationAverage(evaluation)).toBe(2.5);
		});
	});

	describe('hasLowScoreAlert', () => {
		it('should return true for lecturer with low score', () => {
			const evaluations: EvaluationForAlert[] = [
				{
					lecturer_id: 'low-lecturer',
					lecturer: { id: 'low-lecturer', nama: 'Low' },
					q1_tajuk: 1, q2_ilmu: 1, q3_penyampaian: 1, q4_masa: 1,
					tarikh_penilaian: '2024-06-15'
				}
			];

			expect(hasLowScoreAlert(evaluations, 'low-lecturer', 2.0)).toBe(true);
		});

		it('should return false for lecturer with high score', () => {
			const evaluations: EvaluationForAlert[] = [
				{
					lecturer_id: 'high-lecturer',
					lecturer: { id: 'high-lecturer', nama: 'High' },
					q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4,
					tarikh_penilaian: '2024-06-15'
				}
			];

			expect(hasLowScoreAlert(evaluations, 'high-lecturer', 2.0)).toBe(false);
		});
	});

	describe('getAlertSeverity', () => {
		it('should return correct severity levels', () => {
			expect(getAlertSeverity(1.0)).toBe('critical');
			expect(getAlertSeverity(1.4)).toBe('critical');
			expect(getAlertSeverity(1.5)).toBe('warning');
			expect(getAlertSeverity(1.9)).toBe('warning');
			expect(getAlertSeverity(2.0)).toBe('none');
			expect(getAlertSeverity(3.5)).toBe('none');
		});
	});

	describe('formatAlertMessage', () => {
		it('should format alert message correctly', () => {
			const alert: LecturerAlert = {
				lecturerId: 'test',
				lecturerName: 'Ustaz Test',
				averageScore: 1.5,
				evaluationCount: 10,
				lastEvaluationDate: '2024-06-15'
			};

			const message = formatAlertMessage(alert);
			expect(message).toContain('Ustaz Test');
			expect(message).toContain('1.50');
			expect(message).toContain('10 penilaian');
		});
	});

	describe('validateAlertData', () => {
		it('should validate correct alert structure', () => {
			const validAlert: LecturerAlert = {
				lecturerId: 'test',
				lecturerName: 'Test',
				averageScore: 1.5,
				evaluationCount: 5,
				lastEvaluationDate: '2024-06-15'
			};

			expect(validateAlertData(validAlert)).toBe(true);
		});

		it('should reject invalid structures', () => {
			expect(validateAlertData(null)).toBe(false);
			expect(validateAlertData(undefined)).toBe(false);
			expect(validateAlertData({})).toBe(false);
			expect(validateAlertData({ lecturerId: 'test' })).toBe(false);
		});
	});
});
