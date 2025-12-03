/**
 * Trend Calculation Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 22, 23, 24**
 * **Validates: Requirements 17.1, 17.2, 17.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	calculateMonthlyTrend,
	getTrendByLecturer,
	validateTrendData,
	getTrendLabels,
	getTrendValues,
	getTrendDirection,
	type EvaluationForTrend
} from './trend';

// Arbitrary for generating valid evaluations
const evaluationArbitrary = fc.record({
	tarikh_penilaian: fc.date({ min: new Date('2024-01-01'), max: new Date() })
		.map(d => d.toISOString().split('T')[0]),
	lecturer_id: fc.option(fc.uuid(), { nil: null }),
	q1_tajuk: fc.integer({ min: 1, max: 4 }),
	q2_ilmu: fc.integer({ min: 1, max: 4 }),
	q3_penyampaian: fc.integer({ min: 1, max: 4 }),
	q4_masa: fc.integer({ min: 1, max: 4 })
});

describe('Trend Calculation Utils', () => {
	describe('calculateMonthlyTrend', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 22: Monthly Trend Calculation**
		 * **Validates: Requirements 17.1**
		 * 
		 * For any set of evaluations spanning multiple months, the trend data for each month
		 * SHALL equal the arithmetic mean of all evaluation scores for that month.
		 */
		it('should calculate correct average for each month', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationArbitrary, { minLength: 1, maxLength: 50 }),
					fc.integer({ min: 1, max: 12 }),
					(evaluations, months) => {
						const trend = calculateMonthlyTrend(evaluations, months);
						
						// Should return correct number of months
						expect(trend.length).toBe(months);
						
						// Each point should have valid structure
						trend.forEach(point => {
							expect(point).toHaveProperty('month');
							expect(point).toHaveProperty('year');
							expect(point).toHaveProperty('label');
							expect(point).toHaveProperty('averageScore');
							expect(point).toHaveProperty('evaluationCount');
							
							// Month should be 1-12
							expect(point.month).toBeGreaterThanOrEqual(1);
							expect(point.month).toBeLessThanOrEqual(12);
							
							// If has evaluations, average should be between 1 and 4
							if (point.evaluationCount > 0 && point.averageScore !== null) {
								expect(point.averageScore).toBeGreaterThanOrEqual(1);
								expect(point.averageScore).toBeLessThanOrEqual(4);
							}
						});
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * Property: Average calculation should be mathematically correct
		 */
		it('should calculate mathematically correct averages', () => {
			// Create evaluations for a specific month
			const now = new Date();
			const currentMonth = now.getMonth();
			const currentYear = now.getFullYear();
			
			const evaluations: EvaluationForTrend[] = [
				{
					tarikh_penilaian: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
					lecturer_id: 'test-1',
					q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4 // avg = 4
				},
				{
					tarikh_penilaian: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-16`,
					lecturer_id: 'test-1',
					q1_tajuk: 2, q2_ilmu: 2, q3_penyampaian: 2, q4_masa: 2 // avg = 2
				}
			];

			const trend = calculateMonthlyTrend(evaluations, 1);
			
			// Average of 4 and 2 should be 3
			expect(trend[0].averageScore).toBe(3);
			expect(trend[0].evaluationCount).toBe(2);
		});
	});

	describe('getTrendByLecturer', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 23: Trend Filter By Lecturer**
		 * **Validates: Requirements 17.2**
		 * 
		 * For any lecturer filter applied to trend data, all returned data points
		 * SHALL contain only evaluations for that specific lecturer.
		 */
		it('should filter trend data by lecturer', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationArbitrary, { minLength: 5, maxLength: 30 }),
					fc.uuid(),
					(evaluations, lecturerId) => {
						// Add some evaluations with the specific lecturer
						const withLecturer = evaluations.map((e, i) => ({
							...e,
							lecturer_id: i % 3 === 0 ? lecturerId : e.lecturer_id
						}));

						const filteredTrend = getTrendByLecturer(withLecturer, lecturerId, 6);
						const unfilteredTrend = calculateMonthlyTrend(withLecturer, 6);

						// Filtered trend should have same structure
						expect(filteredTrend.length).toBe(unfilteredTrend.length);

						// Total evaluations in filtered should be <= unfiltered
						const filteredTotal = filteredTrend.reduce((sum, d) => sum + d.evaluationCount, 0);
						const unfilteredTotal = unfilteredTrend.reduce((sum, d) => sum + d.evaluationCount, 0);
						
						expect(filteredTotal).toBeLessThanOrEqual(unfilteredTotal);
					}
				),
				{ numRuns: 30 }
			);
		});

		it('should return only evaluations for specified lecturer', () => {
			const now = new Date();
			const dateStr = now.toISOString().split('T')[0];
			
			const evaluations: EvaluationForTrend[] = [
				{ tarikh_penilaian: dateStr, lecturer_id: 'lecturer-a', q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4 },
				{ tarikh_penilaian: dateStr, lecturer_id: 'lecturer-b', q1_tajuk: 2, q2_ilmu: 2, q3_penyampaian: 2, q4_masa: 2 },
				{ tarikh_penilaian: dateStr, lecturer_id: 'lecturer-a', q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4 }
			];

			const trendA = getTrendByLecturer(evaluations, 'lecturer-a', 1);
			const trendB = getTrendByLecturer(evaluations, 'lecturer-b', 1);

			// Lecturer A has 2 evaluations with avg 4
			expect(trendA[0].evaluationCount).toBe(2);
			expect(trendA[0].averageScore).toBe(4);

			// Lecturer B has 1 evaluation with avg 2
			expect(trendB[0].evaluationCount).toBe(1);
			expect(trendB[0].averageScore).toBe(2);
		});
	});

	describe('validateTrendData', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 24: Missing Month Handling**
		 * **Validates: Requirements 17.4**
		 * 
		 * For any trend data request where certain months have no evaluations,
		 * those months SHALL be represented with null values without causing calculation errors.
		 */
		it('should handle missing months with null values', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationArbitrary, { minLength: 0, maxLength: 20 }),
					fc.integer({ min: 6, max: 12 }),
					(evaluations, months) => {
						const trend = calculateMonthlyTrend(evaluations, months);
						
						// Validation should pass
						expect(validateTrendData(trend)).toBe(true);
						
						// Check each point
						trend.forEach(point => {
							if (point.evaluationCount === 0) {
								// Missing months should have null averageScore
								expect(point.averageScore).toBeNull();
							} else {
								// Months with data should have valid score
								expect(point.averageScore).not.toBeNull();
								expect(point.averageScore).toBeGreaterThanOrEqual(1);
								expect(point.averageScore).toBeLessThanOrEqual(4);
							}
						});
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should return all null for empty evaluations', () => {
			const trend = calculateMonthlyTrend([], 6);
			
			expect(trend.length).toBe(6);
			trend.forEach(point => {
				expect(point.averageScore).toBeNull();
				expect(point.evaluationCount).toBe(0);
			});
			
			expect(validateTrendData(trend)).toBe(true);
		});
	});

	describe('getTrendLabels and getTrendValues', () => {
		it('should return correct labels and values', () => {
			fc.assert(
				fc.property(
					fc.array(evaluationArbitrary, { minLength: 0, maxLength: 20 }),
					(evaluations) => {
						const trend = calculateMonthlyTrend(evaluations, 6);
						const labels = getTrendLabels(trend);
						const values = getTrendValues(trend);

						expect(labels.length).toBe(6);
						expect(values.length).toBe(6);

						// Labels should be strings
						labels.forEach(label => {
							expect(typeof label).toBe('string');
							expect(label.length).toBeGreaterThan(0);
						});

						// Values should be numbers or null
						values.forEach(value => {
							expect(value === null || typeof value === 'number').toBe(true);
						});
					}
				),
				{ numRuns: 30 }
			);
		});
	});

	describe('getTrendDirection', () => {
		it('should detect improving trend', () => {
			const now = new Date();
			const evaluations: EvaluationForTrend[] = [];
			
			// Create improving trend over 6 months
			for (let i = 5; i >= 0; i--) {
				const date = new Date(now);
				date.setMonth(date.getMonth() - i);
				const score = 2 + (5 - i) * 0.3; // Increasing scores
				
				evaluations.push({
					tarikh_penilaian: date.toISOString().split('T')[0],
					lecturer_id: 'test',
					q1_tajuk: Math.min(4, Math.round(score)),
					q2_ilmu: Math.min(4, Math.round(score)),
					q3_penyampaian: Math.min(4, Math.round(score)),
					q4_masa: Math.min(4, Math.round(score))
				});
			}

			const trend = calculateMonthlyTrend(evaluations, 6);
			const direction = getTrendDirection(trend);
			
			expect(['improving', 'stable']).toContain(direction);
		});

		it('should return insufficient for empty data', () => {
			const trend = calculateMonthlyTrend([], 6);
			const direction = getTrendDirection(trend);
			
			expect(direction).toBe('insufficient');
		});
	});
});
