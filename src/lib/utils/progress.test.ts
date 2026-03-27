/**
 * Form Progress Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 30: Form Progress Calculation**
 * **Validates: Requirements 20.1, 20.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	calculateProgress,
	calculateEvaluatorProgress,
	calculateRatingsProgress,
	isFormComplete,
	getProgressStatus,
	getProgressColor,
	type FormState,
	type RatingState
} from './progress';

// Arbitrary for evaluator info
const evaluatorInfoArbitrary = fc.record({
	nama: fc.string({ minLength: 0, maxLength: 50 }),
	umur: fc.oneof(fc.string(), fc.integer({ min: 0, max: 100 })),
	alamat: fc.string({ minLength: 0, maxLength: 100 }),
	tarikh: fc.string({ minLength: 0, maxLength: 10 })
});

// Arbitrary for rating state
const ratingStateArbitrary = fc.record({
	q1_tajuk: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
	q2_ilmu: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
	q3_penyampaian: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
	q4_masa: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null })
});

describe('Form Progress Utils', () => {
	describe('calculateProgress', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 30: Form Progress Calculation**
		 * **Validates: Requirements 20.1, 20.2**
		 * 
		 * For any form state, the progress percentage SHALL accurately reflect
		 * the completion status of: evaluator info fields, lecturer selections, and ratings completed.
		 */
		it('should calculate progress between 0 and 100 for any form state', () => {
			fc.assert(
				fc.property(
					evaluatorInfoArbitrary,
					fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
					(evaluatorInfo, selectedLecturers) => {
						const formState: FormState = {
							evaluatorInfo,
							selectedLecturers,
							completedRatings: new Map()
						};

						const progress = calculateProgress(formState);

						// Progress should always be between 0 and 100
						expect(progress).toBeGreaterThanOrEqual(0);
						expect(progress).toBeLessThanOrEqual(100);
					}
				),
				{ numRuns: 100 }
			);
		});

		it('should return 0 for empty form', () => {
			const formState: FormState = {
				evaluatorInfo: { nama: '', umur: '', alamat: '', tarikh: '' },
				selectedLecturers: [],
				completedRatings: new Map()
			};

			expect(calculateProgress(formState)).toBe(0);
		});

		it('should return 100 for complete form', () => {
			const ratings = new Map<string, RatingState>();
			ratings.set('lecturer-1', {
				q1_tajuk: 4,
				q2_ilmu: 4,
				q3_penyampaian: 4,
				q4_masa: 4
			});

			const formState: FormState = {
				evaluatorInfo: {
					nama: 'Test User',
					umur: 30,
					alamat: 'Test Address',
					tarikh: '2024-01-01'
				},
				selectedLecturers: ['lecturer-1'],
				completedRatings: ratings
			};

			expect(calculateProgress(formState)).toBe(100);
		});

		it('should increase progress as fields are filled', () => {
			// Start with empty form
			const formState: FormState = {
				evaluatorInfo: { nama: '', umur: '', alamat: '', tarikh: '' },
				selectedLecturers: [],
				completedRatings: new Map()
			};

			const progress1 = calculateProgress(formState);

			// Add evaluator name
			formState.evaluatorInfo.nama = 'Test';
			const progress2 = calculateProgress(formState);
			expect(progress2).toBeGreaterThan(progress1);

			// Add all evaluator info
			formState.evaluatorInfo.umur = 30;
			formState.evaluatorInfo.alamat = 'Address';
			formState.evaluatorInfo.tarikh = '2024-01-01';
			const progress3 = calculateProgress(formState);
			expect(progress3).toBeGreaterThan(progress2);

			// Select a lecturer
			formState.selectedLecturers = ['lecturer-1'];
			const progress4 = calculateProgress(formState);
			expect(progress4).toBeGreaterThan(progress3);
		});
	});

	describe('calculateEvaluatorProgress', () => {
		it('should return 0 for empty evaluator info', () => {
			const info = { nama: '', umur: '', alamat: '', tarikh: '' };
			expect(calculateEvaluatorProgress(info)).toBe(0);
		});

		it('should return 100 for complete evaluator info', () => {
			const info = { nama: 'Test', umur: 30, alamat: 'Address', tarikh: '2024-01-01' };
			expect(calculateEvaluatorProgress(info)).toBe(100);
		});

		it('should return 25 for each filled field', () => {
			expect(calculateEvaluatorProgress({ nama: 'Test', umur: '', alamat: '', tarikh: '' })).toBe(25);
			expect(calculateEvaluatorProgress({ nama: 'Test', umur: 30, alamat: '', tarikh: '' })).toBe(50);
			expect(calculateEvaluatorProgress({ nama: 'Test', umur: 30, alamat: 'Addr', tarikh: '' })).toBe(75);
		});
	});

	describe('calculateRatingsProgress', () => {
		it('should return 0 for no selected lecturers', () => {
			expect(calculateRatingsProgress([], new Map())).toBe(0);
		});

		it('should return 0 for selected lecturers with no ratings', () => {
			expect(calculateRatingsProgress(['lecturer-1'], new Map())).toBe(0);
		});

		it('should calculate correct progress for partial ratings', () => {
			const ratings = new Map<string, RatingState>();
			ratings.set('lecturer-1', {
				q1_tajuk: 4,
				q2_ilmu: null,
				q3_penyampaian: null,
				q4_masa: null
			});

			// 1 out of 4 fields = 25%
			expect(calculateRatingsProgress(['lecturer-1'], ratings)).toBe(25);
		});

		it('should calculate correct progress for complete ratings', () => {
			const ratings = new Map<string, RatingState>();
			ratings.set('lecturer-1', {
				q1_tajuk: 4,
				q2_ilmu: 4,
				q3_penyampaian: 4,
				q4_masa: 4
			});

			expect(calculateRatingsProgress(['lecturer-1'], ratings)).toBe(100);
		});

		it('should work with Record instead of Map', () => {
			const ratings: Record<string, RatingState> = {
				'lecturer-1': {
					q1_tajuk: 4,
					q2_ilmu: 4,
					q3_penyampaian: 4,
					q4_masa: 4
				}
			};

			expect(calculateRatingsProgress(['lecturer-1'], ratings)).toBe(100);
		});
	});

	describe('isFormComplete', () => {
		it('should return false for incomplete form', () => {
			const formState: FormState = {
				evaluatorInfo: { nama: '', umur: '', alamat: '', tarikh: '' },
				selectedLecturers: [],
				completedRatings: new Map()
			};

			expect(isFormComplete(formState)).toBe(false);
		});

		it('should return true for complete form', () => {
			const ratings = new Map<string, RatingState>();
			ratings.set('lecturer-1', {
				q1_tajuk: 4,
				q2_ilmu: 4,
				q3_penyampaian: 4,
				q4_masa: 4
			});

			const formState: FormState = {
				evaluatorInfo: {
					nama: 'Test',
					umur: 30,
					alamat: 'Address',
					tarikh: '2024-01-01'
				},
				selectedLecturers: ['lecturer-1'],
				completedRatings: ratings
			};

			expect(isFormComplete(formState)).toBe(true);
		});
	});

	describe('getProgressStatus', () => {
		it('should return correct status for different progress levels', () => {
			expect(getProgressStatus(0)).toBe('Belum mula');
			expect(getProgressStatus(15)).toBe('Baru bermula');
			expect(getProgressStatus(45)).toBe('Separuh siap');
			expect(getProgressStatus(80)).toBe('Hampir siap');
			expect(getProgressStatus(100)).toBe('Sedia untuk hantar');
		});
	});

	describe('getProgressColor', () => {
		it('should return correct color class for different progress levels', () => {
			expect(getProgressColor(15)).toBe('progress-low');
			expect(getProgressColor(45)).toBe('progress-medium');
			expect(getProgressColor(80)).toBe('progress-high');
			expect(getProgressColor(100)).toBe('progress-complete');
		});
	});
});
