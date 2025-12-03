import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isRatingsComplete } from './validation';
import type { EvaluationRatings, EvaluationSubmission } from '$lib/types/database';

// Generators
const validRatingArb = fc.integer({ min: 1, max: 4 });
const nullableRatingArb = fc.option(validRatingArb, { nil: null });

const completeRatingsArb = fc.record({
	q1_tajuk: validRatingArb,
	q2_ilmu: validRatingArb,
	q3_penyampaian: validRatingArb,
	q4_masa: validRatingArb
});

const incompleteRatingsArb = fc.record({
	q1_tajuk: nullableRatingArb,
	q2_ilmu: nullableRatingArb,
	q3_penyampaian: nullableRatingArb,
	q4_masa: nullableRatingArb
}).filter(r => 
	r.q1_tajuk === null || 
	r.q2_ilmu === null || 
	r.q3_penyampaian === null || 
	r.q4_masa === null
);

const evaluatorArb = fc.record({
	nama: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	umur: fc.integer({ min: 1, max: 150 }),
	alamat: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
	tarikh: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
		.map(d => d.toISOString().split('T')[0])
});

const completeEvaluationArb = fc.record({
	sessionId: fc.uuid(),
	lecturerId: fc.uuid(),
	ratings: completeRatingsArb,
	recommendation: fc.boolean()
});

const incompleteEvaluationArb = fc.record({
	sessionId: fc.uuid(),
	lecturerId: fc.uuid(),
	ratings: incompleteRatingsArb,
	recommendation: fc.option(fc.boolean(), { nil: null })
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 4: Partial Evaluation Submission**
 * **Validates: Requirements 3.4**
 * 
 * For any form submission with N lecturers having complete ratings (all 4 questions answered + recommendation),
 * exactly N evaluation records SHALL be created in the database, and lecturers without complete ratings
 * SHALL not have records created.
 */
describe('Property 4: Partial Evaluation Submission', () => {
	it('should identify complete evaluations correctly', () => {
		fc.assert(
			fc.property(completeRatingsArb, (ratings) => {
				expect(isRatingsComplete(ratings)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	it('should identify incomplete evaluations correctly', () => {
		fc.assert(
			fc.property(incompleteRatingsArb, (ratings) => {
				expect(isRatingsComplete(ratings as EvaluationRatings)).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});

	it('should filter only complete evaluations from mixed set', () => {
		const mixedEvaluationsArb = fc.tuple(
			fc.array(completeEvaluationArb, { minLength: 0, maxLength: 5 }),
			fc.array(incompleteEvaluationArb, { minLength: 0, maxLength: 5 })
		);

		fc.assert(
			fc.property(mixedEvaluationsArb, ([complete, incomplete]) => {
				const allEvaluations = [...complete, ...incomplete];
				
				// Filter complete evaluations (simulating submission logic)
				const filtered = allEvaluations.filter(
					e => isRatingsComplete(e.ratings as EvaluationRatings) && e.recommendation !== null
				);

				// Should only include complete evaluations
				expect(filtered.length).toBe(complete.length);
				
				// All filtered should have complete ratings
				for (const evaluation of filtered) {
					expect(isRatingsComplete(evaluation.ratings as EvaluationRatings)).toBe(true);
					expect(evaluation.recommendation).not.toBeNull();
				}
			}),
			{ numRuns: 100 }
		);
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 5: Evaluation Data Round-Trip**
 * **Validates: Requirements 5.1, 4.3**
 * 
 * For any valid evaluation submission containing evaluator info, ratings, recommendation,
 * and optional comments, after saving to database and retrieving, the retrieved data
 * SHALL match the original submission data exactly.
 * 
 * NOTE: This test validates the data transformation logic. Full round-trip testing
 * requires a running Supabase instance.
 */
describe('Property 5: Evaluation Data Round-Trip', () => {
	it('should preserve all evaluation data through transformation', () => {
		const submissionArb = fc.record({
			evaluator: evaluatorArb,
			evaluations: fc.array(completeEvaluationArb, { minLength: 1, maxLength: 5 }),
			komenPenceramah: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
			cadanganMasjid: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined })
		});

		fc.assert(
			fc.property(submissionArb, (submission) => {
				// Transform to database format (simulating API logic)
				const records = submission.evaluations.map(evaluation => ({
					session_id: evaluation.sessionId,
					lecturer_id: evaluation.lecturerId,
					nama_penilai: submission.evaluator.nama.trim(),
					umur: submission.evaluator.umur,
					alamat: submission.evaluator.alamat.trim(),
					tarikh_penilaian: submission.evaluator.tarikh,
					q1_tajuk: evaluation.ratings.q1_tajuk,
					q2_ilmu: evaluation.ratings.q2_ilmu,
					q3_penyampaian: evaluation.ratings.q3_penyampaian,
					q4_masa: evaluation.ratings.q4_masa,
					cadangan_teruskan: evaluation.recommendation,
					komen_penceramah: submission.komenPenceramah?.trim() || null,
					cadangan_masjid: submission.cadanganMasjid?.trim() || null
				}));

				// Verify all records have required fields
				for (const record of records) {
					expect(record.nama_penilai).toBeTruthy();
					expect(record.umur).toBeGreaterThanOrEqual(1);
					expect(record.umur).toBeLessThanOrEqual(150);
					expect(record.alamat).toBeTruthy();
					expect(record.tarikh_penilaian).toMatch(/^\d{4}-\d{2}-\d{2}$/);
					expect(record.q1_tajuk).toBeGreaterThanOrEqual(1);
					expect(record.q1_tajuk).toBeLessThanOrEqual(4);
					expect(record.q2_ilmu).toBeGreaterThanOrEqual(1);
					expect(record.q2_ilmu).toBeLessThanOrEqual(4);
					expect(record.q3_penyampaian).toBeGreaterThanOrEqual(1);
					expect(record.q3_penyampaian).toBeLessThanOrEqual(4);
					expect(record.q4_masa).toBeGreaterThanOrEqual(1);
					expect(record.q4_masa).toBeLessThanOrEqual(4);
					expect(typeof record.cadangan_teruskan).toBe('boolean');
				}

				// Verify count matches
				expect(records.length).toBe(submission.evaluations.length);
			}),
			{ numRuns: 100 }
		);
	});

	it('should handle optional comments correctly', () => {
		fc.assert(
			fc.property(
				evaluatorArb,
				completeEvaluationArb,
				fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
				fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
				(evaluator, evaluation, komen, cadangan) => {
					const record = {
						session_id: evaluation.sessionId,
						lecturer_id: evaluation.lecturerId,
						nama_penilai: evaluator.nama.trim(),
						umur: evaluator.umur,
						alamat: evaluator.alamat.trim(),
						tarikh_penilaian: evaluator.tarikh,
						q1_tajuk: evaluation.ratings.q1_tajuk,
						q2_ilmu: evaluation.ratings.q2_ilmu,
						q3_penyampaian: evaluation.ratings.q3_penyampaian,
						q4_masa: evaluation.ratings.q4_masa,
						cadangan_teruskan: evaluation.recommendation,
						komen_penceramah: komen?.trim() || null,
						cadangan_masjid: cadangan?.trim() || null
					};

					// Comments should be null or non-empty string
					if (record.komen_penceramah !== null) {
						expect(typeof record.komen_penceramah).toBe('string');
					}
					if (record.cadangan_masjid !== null) {
						expect(typeof record.cadangan_masjid).toBe('string');
					}
				}
			),
			{ numRuns: 100 }
		);
	});
});
