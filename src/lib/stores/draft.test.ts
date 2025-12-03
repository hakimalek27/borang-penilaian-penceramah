/**
 * Draft Storage Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 31-34**
 * **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5**
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock browser environment and localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
		removeItem: vi.fn((key: string) => { delete store[key]; }),
		clear: vi.fn(() => { store = {}; })
	};
})();

// Mock the browser check
vi.mock('$app/environment', () => ({
	browser: true
}));

// Set up global localStorage mock
Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

import {
	saveDraft,
	loadDraft,
	hasDraft,
	clearDraft,
	getDraftAge,
	formatDraftAge,
	validateDraft,
	createEmptyDraft,
	type DraftData
} from './draft';

// Arbitrary for generating valid draft data
const draftDataArbitrary = fc.record({
	evaluatorInfo: fc.record({
		nama: fc.string({ minLength: 0, maxLength: 50 }),
		umur: fc.oneof(fc.string(), fc.integer({ min: 0, max: 100 })),
		alamat: fc.string({ minLength: 0, maxLength: 100 }),
		tarikh: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
			.map(d => d.toISOString().split('T')[0])
	}),
	selectedLecturers: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
	ratings: fc.dictionary(
		fc.uuid(),
		fc.record({
			q1_tajuk: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
			q2_ilmu: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
			q3_penyampaian: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
			q4_masa: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
			recommendation: fc.option(fc.boolean(), { nil: null })
		})
	),
	komenPenceramah: fc.string({ minLength: 0, maxLength: 200 }),
	cadanganMasjid: fc.string({ minLength: 0, maxLength: 200 })
});

describe('Draft Storage Utils', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe('saveDraft and loadDraft', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 31: Draft Save Round-Trip**
		 * **Validates: Requirements 21.1, 21.3**
		 * 
		 * For any form state saved to localStorage, when restored,
		 * all fields SHALL match the original state exactly.
		 */
		it('should round-trip draft data correctly', () => {
			fc.assert(
				fc.property(
					draftDataArbitrary,
					(data) => {
						// Save draft
						saveDraft(data);

						// Load draft
						const loaded = loadDraft();

						// Should have data
						expect(loaded).not.toBeNull();
						
						if (loaded) {
							// Evaluator info should match
							expect(loaded.evaluatorInfo.nama).toBe(data.evaluatorInfo.nama);
							expect(loaded.evaluatorInfo.alamat).toBe(data.evaluatorInfo.alamat);
							expect(loaded.evaluatorInfo.tarikh).toBe(data.evaluatorInfo.tarikh);
							
							// Selected lecturers should match
							expect(loaded.selectedLecturers).toEqual(data.selectedLecturers);
							
							// Ratings should match
							expect(loaded.ratings).toEqual(data.ratings);
							
							// Comments should match
							expect(loaded.komenPenceramah).toBe(data.komenPenceramah);
							expect(loaded.cadanganMasjid).toBe(data.cadanganMasjid);
						}
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should add version and timestamp when saving', () => {
			const data = createEmptyDraft();
			saveDraft(data);

			const loaded = loadDraft();
			expect(loaded).not.toBeNull();
			expect(loaded?.version).toBe(1);
			expect(loaded?.timestamp).toBeGreaterThan(0);
		});
	});

	describe('hasDraft', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 32: Draft Detection**
		 * **Validates: Requirements 21.2**
		 * 
		 * For any localStorage containing a saved draft,
		 * the system SHALL detect and offer to restore it.
		 */
		it('should detect existing draft', () => {
			fc.assert(
				fc.property(
					draftDataArbitrary,
					(data) => {
						// Initially no draft
						localStorageMock.clear();
						expect(hasDraft()).toBe(false);

						// Save draft
						saveDraft(data);

						// Should detect draft
						expect(hasDraft()).toBe(true);
					}
				),
				{ numRuns: 30 }
			);
		});

		it('should return false for empty localStorage', () => {
			localStorageMock.clear();
			expect(hasDraft()).toBe(false);
		});

		it('should return false for invalid draft data', () => {
			localStorageMock.setItem('evaluation_form_draft', 'invalid json');
			expect(hasDraft()).toBe(false);
		});
	});

	describe('clearDraft', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 33: Draft Cleared After Submission**
		 * **Validates: Requirements 21.4**
		 * 
		 * For any successful form submission, the localStorage draft
		 * SHALL be cleared immediately.
		 */
		it('should clear draft from localStorage', () => {
			fc.assert(
				fc.property(
					draftDataArbitrary,
					(data) => {
						// Save draft
						saveDraft(data);
						expect(hasDraft()).toBe(true);

						// Clear draft
						clearDraft();

						// Should be cleared
						expect(hasDraft()).toBe(false);
						expect(loadDraft()).toBeNull();
					}
				),
				{ numRuns: 30 }
			);
		});

		/**
		 * **Feature: sistem-penilaian-kuliah, Property 34: Draft Manual Clear**
		 * **Validates: Requirements 21.5**
		 * 
		 * For any "Padam Draft" action, the localStorage draft
		 * SHALL be removed and the form SHALL be reset.
		 */
		it('should completely remove draft on manual clear', () => {
			const data = createEmptyDraft();
			data.evaluatorInfo.nama = 'Test User';
			
			saveDraft(data);
			expect(hasDraft()).toBe(true);

			// Manual clear (simulating "Padam Draft" button)
			clearDraft();

			expect(hasDraft()).toBe(false);
			expect(loadDraft()).toBeNull();
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('evaluation_form_draft');
		});
	});

	describe('getDraftAge and formatDraftAge', () => {
		it('should return null for no draft', () => {
			localStorageMock.clear();
			expect(getDraftAge()).toBeNull();
		});

		it('should calculate draft age correctly', () => {
			const data = createEmptyDraft();
			saveDraft(data);

			const age = getDraftAge();
			expect(age).not.toBeNull();
			expect(age).toBeGreaterThanOrEqual(0);
		});

		it('should format age correctly', () => {
			expect(formatDraftAge(0)).toBe('baru sahaja');
			expect(formatDraftAge(30)).toBe('30 minit yang lalu');
			expect(formatDraftAge(90)).toBe('1 jam yang lalu');
			expect(formatDraftAge(1500)).toBe('1 hari yang lalu');
		});
	});

	describe('validateDraft', () => {
		it('should validate correct draft structure', () => {
			const validDraft: DraftData = {
				version: 1,
				timestamp: Date.now(),
				evaluatorInfo: { nama: '', umur: '', alamat: '', tarikh: '' },
				selectedLecturers: [],
				ratings: {},
				komenPenceramah: '',
				cadanganMasjid: ''
			};

			expect(validateDraft(validDraft)).toBe(true);
		});

		it('should reject invalid draft structures', () => {
			expect(validateDraft(null)).toBe(false);
			expect(validateDraft(undefined)).toBe(false);
			expect(validateDraft('string')).toBe(false);
			expect(validateDraft({ version: 'wrong' })).toBe(false);
			expect(validateDraft({ version: 1 })).toBe(false);
		});
	});

	describe('createEmptyDraft', () => {
		it('should create valid empty draft', () => {
			const empty = createEmptyDraft();

			expect(empty.evaluatorInfo.nama).toBe('');
			expect(empty.evaluatorInfo.umur).toBe('');
			expect(empty.evaluatorInfo.alamat).toBe('');
			expect(empty.evaluatorInfo.tarikh).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(empty.selectedLecturers).toEqual([]);
			expect(empty.ratings).toEqual({});
			expect(empty.komenPenceramah).toBe('');
			expect(empty.cadanganMasjid).toBe('');
		});
	});
});
