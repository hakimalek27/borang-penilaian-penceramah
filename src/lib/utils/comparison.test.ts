import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	calculateLecturerComparison,
	getComparisonLabels,
	getComparisonValues,
	getComparisonColors,
	type EvaluationForComparison,
	type LecturerInfo
} from './comparison';

// Arbitraries
const ratingArb = fc.integer({ min: 1, max: 4 });

const evaluationArb = fc.record({
	lecturer_id: fc.uuid(),
	q1_tajuk: ratingArb,
	q2_ilmu: ratingArb,
	q3_penyampaian: ratingArb,
	q4_masa: ratingArb,
	cadangan_teruskan: fc.boolean()
});

const lecturerArb = fc.record({
	id: fc.uuid(),
	nama: fc.string({ minLength: 1, maxLength: 50 })
});

describe('Comparison Utils', () => {
	describe('calculateLecturerComparison', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 25: Lecturer Comparison Scores**
		 * **Validates: Requirements 18.2**
		 */
		it('should calculate accurate average scores per rating question for each lecturer', () => {
			fc.assert(
				fc.property(
					fc.array(lecturerArb, { minLength: 2, maxLength: 5 }),
					fc.array(evaluationArb, { minLength: 1, maxLength: 50 }),
					(lecturers, baseEvaluations) => {
						// Assign evaluations to lecturers
						const evaluations = baseEvaluations.map((e, i) => ({
							...e,
							lecturer_id: lecturers[i % lecturers.length].id
						}));
						
						const lecturerIds = lecturers.map(l => l.id);
						const result = calculateLecturerComparison(evaluations, lecturers, lecturerIds);
						
						// Verify each lecturer's scores
						for (const comparison of result) {
							const lecturerEvals = evaluations.filter(
								e => e.lecturer_id === comparison.lecturerId
							);
							
							if (lecturerEvals.length === 0) {
								expect(comparison.avgQ1).toBe(0);
								expect(comparison.avgQ2).toBe(0);
								expect(comparison.avgQ3).toBe(0);
								expect(comparison.avgQ4).toBe(0);
								expect(comparison.avgOverall).toBe(0);
							} else {
								// Calculate expected averages
								const expectedQ1 = lecturerEvals.reduce((s, e) => s + e.q1_tajuk, 0) / lecturerEvals.length;
								const expectedQ2 = lecturerEvals.reduce((s, e) => s + e.q2_ilmu, 0) / lecturerEvals.length;
								const expectedQ3 = lecturerEvals.reduce((s, e) => s + e.q3_penyampaian, 0) / lecturerEvals.length;
								const expectedQ4 = lecturerEvals.reduce((s, e) => s + e.q4_masa, 0) / lecturerEvals.length;
								const expectedOverall = (expectedQ1 + expectedQ2 + expectedQ3 + expectedQ4) / 4;
								
								expect(comparison.avgQ1).toBeCloseTo(expectedQ1, 1);
								expect(comparison.avgQ2).toBeCloseTo(expectedQ2, 1);
								expect(comparison.avgQ3).toBeCloseTo(expectedQ3, 1);
								expect(comparison.avgQ4).toBeCloseTo(expectedQ4, 1);
								expect(comparison.avgOverall).toBeCloseTo(expectedOverall, 1);
							}
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * **Feature: sistem-penilaian-kuliah, Property 26: Comparison Recommendation Percentage**
		 * **Validates: Requirements 18.3**
		 */
		it('should calculate recommendation percentage correctly', () => {
			fc.assert(
				fc.property(
					fc.array(lecturerArb, { minLength: 1, maxLength: 5 }),
					fc.array(evaluationArb, { minLength: 1, maxLength: 50 }),
					(lecturers, baseEvaluations) => {
						// Assign evaluations to lecturers
						const evaluations = baseEvaluations.map((e, i) => ({
							...e,
							lecturer_id: lecturers[i % lecturers.length].id
						}));
						
						const lecturerIds = lecturers.map(l => l.id);
						const result = calculateLecturerComparison(evaluations, lecturers, lecturerIds);
						
						// Verify recommendation percentages
						for (const comparison of result) {
							const lecturerEvals = evaluations.filter(
								e => e.lecturer_id === comparison.lecturerId
							);
							
							if (lecturerEvals.length === 0) {
								expect(comparison.recommendationYesPercent).toBe(0);
								expect(comparison.recommendationNoPercent).toBe(0);
							} else {
								const yesCount = lecturerEvals.filter(e => e.cadangan_teruskan).length;
								const expectedYesPercent = (yesCount / lecturerEvals.length) * 100;
								const expectedNoPercent = 100 - expectedYesPercent;
								
								expect(comparison.recommendationYesPercent).toBeCloseTo(expectedYesPercent, 0);
								expect(comparison.recommendationNoPercent).toBeCloseTo(expectedNoPercent, 0);
								
								// Sum should be 100%
								expect(
									comparison.recommendationYesPercent + comparison.recommendationNoPercent
								).toBeCloseTo(100, 0);
							}
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return correct total evaluations count', () => {
			const lecturers: LecturerInfo[] = [
				{ id: 'l1', nama: 'Lecturer 1' },
				{ id: 'l2', nama: 'Lecturer 2' }
			];
			
			const evaluations: EvaluationForComparison[] = [
				{ lecturer_id: 'l1', q1_tajuk: 3, q2_ilmu: 4, q3_penyampaian: 3, q4_masa: 4, cadangan_teruskan: true },
				{ lecturer_id: 'l1', q1_tajuk: 4, q2_ilmu: 4, q3_penyampaian: 4, q4_masa: 4, cadangan_teruskan: true },
				{ lecturer_id: 'l2', q1_tajuk: 2, q2_ilmu: 3, q3_penyampaian: 2, q4_masa: 3, cadangan_teruskan: false }
			];
			
			const result = calculateLecturerComparison(evaluations, lecturers, ['l1', 'l2']);
			
			expect(result[0].totalEvaluations).toBe(2);
			expect(result[1].totalEvaluations).toBe(1);
		});

		it('should handle lecturer with no evaluations', () => {
			const lecturers: LecturerInfo[] = [
				{ id: 'l1', nama: 'Lecturer 1' },
				{ id: 'l2', nama: 'Lecturer 2' }
			];
			
			const evaluations: EvaluationForComparison[] = [
				{ lecturer_id: 'l1', q1_tajuk: 3, q2_ilmu: 4, q3_penyampaian: 3, q4_masa: 4, cadangan_teruskan: true }
			];
			
			const result = calculateLecturerComparison(evaluations, lecturers, ['l1', 'l2']);
			
			expect(result[1].totalEvaluations).toBe(0);
			expect(result[1].avgOverall).toBe(0);
			expect(result[1].recommendationYesPercent).toBe(0);
		});
	});

	describe('getComparisonLabels', () => {
		it('should return correct labels', () => {
			const labels = getComparisonLabels();
			expect(labels).toEqual(['Tajuk', 'Ilmu', 'Penyampaian', 'Masa']);
		});
	});

	describe('getComparisonValues', () => {
		it('should return values in correct order', () => {
			const comparison = {
				lecturerId: 'l1',
				lecturerName: 'Test',
				avgQ1: 3.5,
				avgQ2: 4.0,
				avgQ3: 3.0,
				avgQ4: 3.75,
				avgOverall: 3.56,
				recommendationYesPercent: 80,
				recommendationNoPercent: 20,
				totalEvaluations: 10
			};
			
			const values = getComparisonValues(comparison);
			expect(values).toEqual([3.5, 4.0, 3.0, 3.75]);
		});
	});

	describe('getComparisonColors', () => {
		it('should return correct number of colors', () => {
			expect(getComparisonColors(3)).toHaveLength(3);
			expect(getComparisonColors(5)).toHaveLength(5);
			expect(getComparisonColors(8)).toHaveLength(8);
		});
	});
});
