import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	calculateLecturerScores,
	calculateRecommendationStats,
	countEvaluationsPerLecturer,
	calculateQuestionAverage
} from './calculations';
import type { Evaluation } from '$lib/types/database';

// Generator for valid evaluation
const evaluationArb = fc.record({
	id: fc.uuid(),
	session_id: fc.option(fc.uuid(), { nil: null }),
	lecturer_id: fc.uuid(),
	nama_penilai: fc.string({ minLength: 1 }),
	umur: fc.integer({ min: 1, max: 150 }),
	alamat: fc.string({ minLength: 1 }),
	tarikh_penilaian: fc.date().map(d => d.toISOString().split('T')[0]),
	q1_tajuk: fc.integer({ min: 1, max: 4 }),
	q2_ilmu: fc.integer({ min: 1, max: 4 }),
	q3_penyampaian: fc.integer({ min: 1, max: 4 }),
	q4_masa: fc.integer({ min: 1, max: 4 }),
	cadangan_teruskan: fc.boolean(),
	komen_penceramah: fc.option(fc.string(), { nil: null }),
	cadangan_masjid: fc.option(fc.string(), { nil: null }),
	created_at: fc.date().map(d => d.toISOString())
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 12: Lecturer Ranking Calculation**
 * **Validates: Requirements 9.2**
 * 
 * For any set of evaluations, the top-rated lecturer SHALL have the highest average overall score,
 * and the lowest-rated lecturer SHALL have the lowest average overall score.
 */
describe('Property 12: Lecturer Ranking Calculation', () => {
	it('should rank lecturers by average overall score', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationArb, { minLength: 2, maxLength: 20 }),
				(evaluations) => {
					// Create lecturer names map
					const lecturerNames: Record<string, string> = {};
					for (const e of evaluations) {
						if (e.lecturer_id) {
							lecturerNames[e.lecturer_id] = `Lecturer ${e.lecturer_id.slice(0, 8)}`;
						}
					}

					const scores = calculateLecturerScores(evaluations as Evaluation[], lecturerNames);

					if (scores.length >= 2) {
						// Verify sorted in descending order by avgOverall
						for (let i = 0; i < scores.length - 1; i++) {
							expect(scores[i].avgOverall).toBeGreaterThanOrEqual(scores[i + 1].avgOverall);
						}

						// Top lecturer has highest score
						const topScore = Math.max(...scores.map(s => s.avgOverall));
						expect(scores[0].avgOverall).toBe(topScore);

						// Bottom lecturer has lowest score
						const bottomScore = Math.min(...scores.map(s => s.avgOverall));
						expect(scores[scores.length - 1].avgOverall).toBe(bottomScore);
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 13: Average Score Calculation**
 * **Validates: Requirements 10.2**
 * 
 * For any set of evaluations filtered by given criteria, the calculated average score
 * for each question (q1-q4) SHALL equal the arithmetic mean of all matching evaluation scores.
 */
describe('Property 13: Average Score Calculation', () => {
	it('should calculate correct arithmetic mean for each question', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationArb, { minLength: 1, maxLength: 20 }),
				(evaluations) => {
					const evals = evaluations as Evaluation[];

					// Calculate expected averages manually
					const expectedQ1 = evals.reduce((sum, e) => sum + e.q1_tajuk, 0) / evals.length;
					const expectedQ2 = evals.reduce((sum, e) => sum + e.q2_ilmu, 0) / evals.length;
					const expectedQ3 = evals.reduce((sum, e) => sum + e.q3_penyampaian, 0) / evals.length;
					const expectedQ4 = evals.reduce((sum, e) => sum + e.q4_masa, 0) / evals.length;

					// Calculate using function
					const actualQ1 = calculateQuestionAverage(evals, 'q1_tajuk');
					const actualQ2 = calculateQuestionAverage(evals, 'q2_ilmu');
					const actualQ3 = calculateQuestionAverage(evals, 'q3_penyampaian');
					const actualQ4 = calculateQuestionAverage(evals, 'q4_masa');

					// Verify equality (with floating point tolerance)
					expect(actualQ1).toBeCloseTo(expectedQ1, 10);
					expect(actualQ2).toBeCloseTo(expectedQ2, 10);
					expect(actualQ3).toBeCloseTo(expectedQ3, 10);
					expect(actualQ4).toBeCloseTo(expectedQ4, 10);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should return 0 for empty evaluations', () => {
		expect(calculateQuestionAverage([], 'q1_tajuk')).toBe(0);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 14: Recommendation Distribution Calculation**
 * **Validates: Requirements 10.4**
 * 
 * For any set of evaluations, the Ya count SHALL equal the number of evaluations
 * where cadangan_teruskan is true, and the Tidak count SHALL equal the number where it is false.
 */
describe('Property 14: Recommendation Distribution Calculation', () => {
	it('should count Ya and Tidak correctly', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationArb, { minLength: 0, maxLength: 50 }),
				(evaluations) => {
					const evals = evaluations as Evaluation[];
					const stats = calculateRecommendationStats(evals);

					// Count manually
					const expectedYa = evals.filter(e => e.cadangan_teruskan).length;
					const expectedTidak = evals.filter(e => !e.cadangan_teruskan).length;

					expect(stats.ya).toBe(expectedYa);
					expect(stats.tidak).toBe(expectedTidak);
					expect(stats.ya + stats.tidak).toBe(evals.length);
				}
			),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 15: Evaluation Count Accuracy**
 * **Validates: Requirements 10.5**
 * 
 * For any filter criteria applied to evaluations, the displayed count per lecturer
 * SHALL equal the actual number of evaluation records matching that lecturer.
 */
describe('Property 15: Evaluation Count Accuracy', () => {
	it('should count evaluations per lecturer correctly', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationArb, { minLength: 0, maxLength: 30 }),
				(evaluations) => {
					const evals = evaluations as Evaluation[];
					const counts = countEvaluationsPerLecturer(evals);

					// Verify each count
					for (const [lecturerId, count] of Object.entries(counts)) {
						const actualCount = evals.filter(e => e.lecturer_id === lecturerId).length;
						expect(count).toBe(actualCount);
					}

					// Verify total
					const totalCounted = Object.values(counts).reduce((sum, c) => sum + c, 0);
					const evalsWithLecturer = evals.filter(e => e.lecturer_id !== null).length;
					expect(totalCounted).toBe(evalsWithLecturer);
				}
			),
			{ numRuns: 100 }
		);
	});
});
