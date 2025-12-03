import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateEvaluatorInfo, isValidDate, isRatingsComplete, isValidRating } from './validation';
import type { EvaluatorInfo, EvaluationRatings } from '$lib/types/database';

/**
 * **Feature: sistem-penilaian-kuliah, Property 1: Form Validation Rejects Incomplete Submissions**
 * **Validates: Requirements 1.3**
 * 
 * For any form submission attempt where one or more required fields (nama, umur, alamat, tarikh)
 * are empty or invalid, the submission SHALL be prevented and the form state SHALL remain unchanged.
 */
describe('Property 1: Form Validation Rejects Incomplete Submissions', () => {
	// Generator for valid evaluator info
	const validEvaluatorArb = fc.record({
		nama: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
		umur: fc.integer({ min: 1, max: 150 }),
		alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
		tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
			.map(d => d.toISOString().split('T')[0])
	});

	// Generator for invalid evaluator info (at least one field invalid)
	const invalidEvaluatorArb = fc.oneof(
		// Missing nama
		fc.record({
			nama: fc.constant(''),
			umur: fc.integer({ min: 1, max: 150 }),
			alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
				.map(d => d.toISOString().split('T')[0])
		}),
		// Whitespace-only nama
		fc.record({
			nama: fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 }),
			umur: fc.integer({ min: 1, max: 150 }),
			alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
				.map(d => d.toISOString().split('T')[0])
		}),
		// Invalid umur (negative)
		fc.record({
			nama: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			umur: fc.integer({ min: -100, max: 0 }),
			alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
				.map(d => d.toISOString().split('T')[0])
		}),
		// Invalid umur (too high)
		fc.record({
			nama: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			umur: fc.integer({ min: 151, max: 500 }),
			alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
				.map(d => d.toISOString().split('T')[0])
		}),
		// Missing alamat
		fc.record({
			nama: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			umur: fc.integer({ min: 1, max: 150 }),
			alamat: fc.constant(''),
			tarikh: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
				.map(d => d.toISOString().split('T')[0])
		}),
		// Invalid tarikh format
		fc.record({
			nama: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			umur: fc.integer({ min: 1, max: 150 }),
			alamat: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
			tarikh: fc.constant('invalid-date')
		})
	);

	it('should accept valid evaluator info', () => {
		fc.assert(
			fc.property(validEvaluatorArb, (info) => {
				const result = validateEvaluatorInfo(info);
				expect(result.isValid).toBe(true);
				expect(result.errors).toHaveLength(0);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject invalid evaluator info', () => {
		fc.assert(
			fc.property(invalidEvaluatorArb, (info) => {
				const result = validateEvaluatorInfo(info);
				expect(result.isValid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject partial evaluator info (missing fields)', () => {
		const partialInfoArb = fc.record({
			nama: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
			umur: fc.option(fc.integer({ min: 1, max: 150 }), { nil: undefined }),
			alamat: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
			tarikh: fc.option(fc.constant('2024-01-01'), { nil: undefined })
		}).filter(info => {
			// At least one field must be missing
			return info.nama === undefined || 
				   info.umur === undefined || 
				   info.alamat === undefined || 
				   info.tarikh === undefined;
		});

		fc.assert(
			fc.property(partialInfoArb, (info) => {
				const result = validateEvaluatorInfo(info as Partial<EvaluatorInfo>);
				expect(result.isValid).toBe(false);
			}),
			{ numRuns: 100 }
		);
	});
});

describe('isValidDate', () => {
	it('should accept valid date strings', () => {
		expect(isValidDate('2024-01-15')).toBe(true);
		expect(isValidDate('2025-12-31')).toBe(true);
	});

	it('should reject invalid date formats', () => {
		expect(isValidDate('15-01-2024')).toBe(false);
		expect(isValidDate('2024/01/15')).toBe(false);
		expect(isValidDate('invalid')).toBe(false);
		expect(isValidDate('')).toBe(false);
	});
});

describe('isValidRating', () => {
	it('should accept ratings 1-4', () => {
		expect(isValidRating(1)).toBe(true);
		expect(isValidRating(2)).toBe(true);
		expect(isValidRating(3)).toBe(true);
		expect(isValidRating(4)).toBe(true);
	});

	it('should reject invalid ratings', () => {
		expect(isValidRating(0)).toBe(false);
		expect(isValidRating(5)).toBe(false);
		expect(isValidRating(-1)).toBe(false);
		expect(isValidRating(null)).toBe(false);
		expect(isValidRating(2.5)).toBe(false);
	});
});

describe('isRatingsComplete', () => {
	it('should return true for complete ratings', () => {
		const complete: EvaluationRatings = {
			q1_tajuk: 4,
			q2_ilmu: 3,
			q3_penyampaian: 4,
			q4_masa: 2
		};
		expect(isRatingsComplete(complete)).toBe(true);
	});

	it('should return false for incomplete ratings', () => {
		const incomplete: EvaluationRatings = {
			q1_tajuk: 4,
			q2_ilmu: null,
			q3_penyampaian: 4,
			q4_masa: 2
		};
		expect(isRatingsComplete(incomplete)).toBe(false);
	});
});
