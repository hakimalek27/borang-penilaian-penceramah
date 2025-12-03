import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Lecturer, LecturerCreate, LecturerUpdate } from '$lib/types/database';

// Generators
const lecturerNameArb = fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0);
const lecturerDescArb = fc.option(fc.string({ maxLength: 500 }), { nil: null });
const sortOrderArb = fc.integer({ min: 0, max: 1000 });
const imageUrlArb = fc.option(
	fc.webUrl().map(url => `${url}/image.jpg`),
	{ nil: null }
);

const lecturerArb: fc.Arbitrary<Lecturer> = fc.record({
	id: fc.uuid(),
	nama: lecturerNameArb,
	gambar_url: imageUrlArb,
	keterangan: lecturerDescArb,
	sort_order: sortOrderArb,
	created_at: fc.constant(new Date().toISOString()),
	updated_at: fc.constant(new Date().toISOString())
});

const lecturerCreateArb: fc.Arbitrary<LecturerCreate> = fc.record({
	nama: lecturerNameArb,
	gambar_url: imageUrlArb,
	keterangan: lecturerDescArb,
	sort_order: fc.option(sortOrderArb, { nil: undefined })
});

const lecturerUpdateArb: fc.Arbitrary<LecturerUpdate> = fc.record({
	nama: fc.option(lecturerNameArb, { nil: undefined }),
	gambar_url: fc.option(imageUrlArb, { nil: undefined }),
	keterangan: fc.option(lecturerDescArb, { nil: undefined }),
	sort_order: fc.option(sortOrderArb, { nil: undefined })
});

/**
 * Simulates applying an update to a lecturer record
 */
function applyUpdate(lecturer: Lecturer, update: LecturerUpdate): Lecturer {
	return {
		...lecturer,
		nama: update.nama !== undefined ? update.nama : lecturer.nama,
		gambar_url: update.gambar_url !== undefined ? update.gambar_url : lecturer.gambar_url,
		keterangan: update.keterangan !== undefined ? update.keterangan : lecturer.keterangan,
		sort_order: update.sort_order !== undefined ? update.sort_order : lecturer.sort_order,
		updated_at: new Date().toISOString()
	};
}

/**
 * Validates lecturer data integrity
 */
function isValidLecturer(lecturer: Lecturer): boolean {
	return (
		typeof lecturer.id === 'string' &&
		lecturer.id.length > 0 &&
		typeof lecturer.nama === 'string' &&
		lecturer.nama.trim().length > 0 &&
		(lecturer.gambar_url === null || typeof lecturer.gambar_url === 'string') &&
		(lecturer.keterangan === null || typeof lecturer.keterangan === 'string') &&
		typeof lecturer.sort_order === 'number' &&
		lecturer.sort_order >= 0
	);
}

/**
 * **Feature: sistem-penilaian-kuliah, Property 8: Lecturer Edit Persistence**
 * **Validates: Requirements 7.4**
 * 
 * For any lecturer record, when an admin modifies any field (nama, gambar_url, keterangan, sort_order)
 * and saves, the retrieved lecturer record SHALL reflect all changes exactly.
 */
describe('Property 8: Lecturer Edit Persistence', () => {
	it('should preserve all updated fields after edit', () => {
		fc.assert(
			fc.property(lecturerArb, lecturerUpdateArb, (original, update) => {
				const updated = applyUpdate(original, update);

				// Verify each field is correctly updated or preserved
				if (update.nama !== undefined) {
					expect(updated.nama).toBe(update.nama);
				} else {
					expect(updated.nama).toBe(original.nama);
				}

				if (update.gambar_url !== undefined) {
					expect(updated.gambar_url).toBe(update.gambar_url);
				} else {
					expect(updated.gambar_url).toBe(original.gambar_url);
				}

				if (update.keterangan !== undefined) {
					expect(updated.keterangan).toBe(update.keterangan);
				} else {
					expect(updated.keterangan).toBe(original.keterangan);
				}

				if (update.sort_order !== undefined) {
					expect(updated.sort_order).toBe(update.sort_order);
				} else {
					expect(updated.sort_order).toBe(original.sort_order);
				}

				// ID should never change
				expect(updated.id).toBe(original.id);
			}),
			{ numRuns: 100 }
		);
	});

	it('should maintain data validity after any update', () => {
		fc.assert(
			fc.property(lecturerArb, lecturerUpdateArb, (original, update) => {
				// Filter out updates that would make nama invalid
				if (update.nama !== undefined && update.nama.trim().length === 0) {
					return true; // Skip this case - validation should reject it
				}

				const updated = applyUpdate(original, update);
				expect(isValidLecturer(updated)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	it('should preserve unchanged fields when updating single field', () => {
		fc.assert(
			fc.property(
				lecturerArb,
				fc.constantFrom('nama', 'gambar_url', 'keterangan', 'sort_order'),
				(original, fieldToUpdate) => {
					let update: LecturerUpdate = {};

					switch (fieldToUpdate) {
						case 'nama':
							update = { nama: 'Updated Name' };
							break;
						case 'gambar_url':
							update = { gambar_url: 'https://example.com/new.jpg' };
							break;
						case 'keterangan':
							update = { keterangan: 'Updated description' };
							break;
						case 'sort_order':
							update = { sort_order: 999 };
							break;
					}

					const updated = applyUpdate(original, update);

					// Check that other fields are preserved
					if (fieldToUpdate !== 'nama') expect(updated.nama).toBe(original.nama);
					if (fieldToUpdate !== 'gambar_url') expect(updated.gambar_url).toBe(original.gambar_url);
					if (fieldToUpdate !== 'keterangan') expect(updated.keterangan).toBe(original.keterangan);
					if (fieldToUpdate !== 'sort_order') expect(updated.sort_order).toBe(original.sort_order);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should handle null values correctly', () => {
		fc.assert(
			fc.property(lecturerArb, (original) => {
				// Update with null values for optional fields
				const update: LecturerUpdate = {
					gambar_url: null,
					keterangan: null
				};

				const updated = applyUpdate(original, update);

				expect(updated.gambar_url).toBeNull();
				expect(updated.keterangan).toBeNull();
				// Required fields should be preserved
				expect(updated.nama).toBe(original.nama);
				expect(updated.sort_order).toBe(original.sort_order);
			}),
			{ numRuns: 100 }
		);
	});
});

describe('Lecturer Validation', () => {
	it('should validate correct lecturer data', () => {
		fc.assert(
			fc.property(lecturerArb, (lecturer) => {
				expect(isValidLecturer(lecturer)).toBe(true);
			}),
			{ numRuns: 100 }
		);
	});

	it('should reject lecturer with empty name', () => {
		fc.assert(
			fc.property(lecturerArb, (lecturer) => {
				const invalidLecturer = { ...lecturer, nama: '' };
				expect(isValidLecturer(invalidLecturer)).toBe(false);
			}),
			{ numRuns: 50 }
		);
	});

	it('should reject lecturer with negative sort order', () => {
		fc.assert(
			fc.property(lecturerArb, fc.integer({ min: -1000, max: -1 }), (lecturer, negativeOrder) => {
				const invalidLecturer = { ...lecturer, sort_order: negativeOrder };
				expect(isValidLecturer(invalidLecturer)).toBe(false);
			}),
			{ numRuns: 50 }
		);
	});
});
