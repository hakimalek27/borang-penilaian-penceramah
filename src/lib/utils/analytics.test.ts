import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateAnalytics, calculateTrend, type AnalyticsInput } from './analytics';
import type { LecturerSummary } from './export';

// Arbitraries
const scoreArb = fc.integer({ min: 1, max: 4 });

const lecturerSummaryArb: fc.Arbitrary<LecturerSummary> = fc.record({
	lecturerName: fc.string({ minLength: 1, maxLength: 50 }),
	avgQ1: fc.float({ min: 1, max: 4 }),
	avgQ2: fc.float({ min: 1, max: 4 }),
	avgQ3: fc.float({ min: 1, max: 4 }),
	avgQ4: fc.float({ min: 1, max: 4 }),
	avgOverall: fc.float({ min: 1, max: 4 }),
	totalEvaluations: fc.integer({ min: 1, max: 100 }),
	recommendationYesPercent: fc.float({ min: 0, max: 100 })
});

const evaluationArb = fc.record({
	q1_tajuk: scoreArb,
	q2_ilmu: scoreArb,
	q3_penyampaian: scoreArb,
	q4_masa: scoreArb,
	cadangan_teruskan: fc.boolean(),
	lecturer_id: fc.uuid()
});

describe('Analytics Utils', () => {
	describe('generateAnalytics', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property: Analytics Generation**
		 * **Validates: Requirements for comprehensive reporting**
		 */
		it('should generate valid analytics for any input', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationArb, { minLength: 0, maxLength: 20 }),
					fc.array(lecturerSummaryArb, { minLength: 0, maxLength: 10 }),
					fc.string({ minLength: 1, maxLength: 50 }),
					(evaluations, lecturerScores, period) => {
						const input: AnalyticsInput = { evaluations, lecturerScores, period };
						const result = generateAnalytics(input);

						// Summary should always be present
						expect(result.summary).toBeDefined();
						expect(result.summary.period).toBe(period);
						expect(result.summary.totalEvaluations).toBe(evaluations.length);
						expect(result.summary.totalLecturers).toBe(lecturerScores.length);

						// Insights should always be present
						expect(result.insights).toBeDefined();
						expect(Array.isArray(result.insights.strengths)).toBe(true);
						expect(Array.isArray(result.insights.improvements)).toBe(true);
						expect(Array.isArray(result.insights.recommendations)).toBe(true);
						expect(Array.isArray(result.insights.keyFindings)).toBe(true);

						// Risk assessment should match lecturer count
						expect(result.riskAssessment.length).toBe(lecturerScores.length);
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should identify top performer correctly', () => {
			const lecturerScores: LecturerSummary[] = [
				{ lecturerName: 'A', avgQ1: 3.5, avgQ2: 3.5, avgQ3: 3.5, avgQ4: 3.5, avgOverall: 3.5, totalEvaluations: 10, recommendationYesPercent: 90 },
				{ lecturerName: 'B', avgQ1: 2.5, avgQ2: 2.5, avgQ3: 2.5, avgQ4: 2.5, avgOverall: 2.5, totalEvaluations: 10, recommendationYesPercent: 70 },
				{ lecturerName: 'C', avgQ1: 3.8, avgQ2: 3.8, avgQ3: 3.8, avgQ4: 3.8, avgOverall: 3.8, totalEvaluations: 10, recommendationYesPercent: 95 }
			];

			const result = generateAnalytics({
				evaluations: [],
				lecturerScores,
				period: 'Test'
			});

			expect(result.insights.topPerformer?.name).toBe('C');
			expect(result.insights.topPerformer?.score).toBe(3.8);
		});

		it('should identify needs attention correctly', () => {
			const lecturerScores: LecturerSummary[] = [
				{ lecturerName: 'A', avgQ1: 3.5, avgQ2: 3.5, avgQ3: 3.5, avgQ4: 3.5, avgOverall: 3.5, totalEvaluations: 10, recommendationYesPercent: 90 },
				{ lecturerName: 'B', avgQ1: 2.0, avgQ2: 2.0, avgQ3: 2.0, avgQ4: 2.0, avgOverall: 2.0, totalEvaluations: 10, recommendationYesPercent: 40 }
			];

			const result = generateAnalytics({
				evaluations: [],
				lecturerScores,
				period: 'Test'
			});

			expect(result.insights.needsAttention?.name).toBe('B');
			expect(result.insights.needsAttention?.score).toBe(2.0);
		});

		it('should assess risk levels correctly', () => {
			const lecturerScores: LecturerSummary[] = [
				{ lecturerName: 'High Risk', avgQ1: 1.5, avgQ2: 1.5, avgQ3: 1.5, avgQ4: 1.5, avgOverall: 1.5, totalEvaluations: 2, recommendationYesPercent: 30 },
				{ lecturerName: 'Medium Risk', avgQ1: 2.5, avgQ2: 2.5, avgQ3: 2.5, avgQ4: 2.5, avgOverall: 2.5, totalEvaluations: 5, recommendationYesPercent: 60 },
				{ lecturerName: 'Low Risk', avgQ1: 3.5, avgQ2: 3.5, avgQ3: 3.5, avgQ4: 3.5, avgOverall: 3.5, totalEvaluations: 20, recommendationYesPercent: 95 }
			];

			const result = generateAnalytics({
				evaluations: [],
				lecturerScores,
				period: 'Test'
			});

			const highRisk = result.riskAssessment.find(r => r.lecturerName === 'High Risk');
			const lowRisk = result.riskAssessment.find(r => r.lecturerName === 'Low Risk');

			expect(highRisk?.riskLevel).toBe('high');
			expect(lowRisk?.riskLevel).toBe('low');
		});
	});

	describe('calculateTrend', () => {
		it('should identify improving trend', () => {
			expect(calculateTrend(3.5, 3.0)).toBe('up');
			expect(calculateTrend(3.0, 2.5)).toBe('up');
		});

		it('should identify declining trend', () => {
			expect(calculateTrend(2.5, 3.0)).toBe('down');
			expect(calculateTrend(3.0, 3.5)).toBe('down');
		});

		it('should identify stable trend', () => {
			expect(calculateTrend(3.0, 3.0)).toBe('stable');
			expect(calculateTrend(3.05, 3.0)).toBe('stable');
			expect(calculateTrend(2.95, 3.0)).toBe('stable');
		});

		/**
		 * **Feature: sistem-penilaian-kuliah, Property: Trend Calculation**
		 * **Validates: Requirements for trend analysis**
		 */
		it('should always return valid trend for any scores', () => {
			fc.assert(
				fc.property(
					fc.float({ min: 1, max: 4 }),
					fc.float({ min: 1, max: 4 }),
					(current, previous) => {
						const trend = calculateTrend(current, previous);
						expect(['up', 'down', 'stable']).toContain(trend);
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
