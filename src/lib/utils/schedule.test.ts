import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { groupSessionsByWeek, hasRequiredLecturerInfo, formatLecturerCardData } from './schedule';
import type { LectureSession, Lecturer, Hari, JenisKuliah } from '$lib/types/database';

// Generators
const hariArb = fc.constantFrom<Hari>('Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad');
const jenisKuliahArb = fc.constantFrom<JenisKuliah>('Subuh', 'Maghrib');

const lecturerArb = fc.record({
	id: fc.uuid(),
	nama: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	gambar_url: fc.option(fc.webUrl(), { nil: null }),
	keterangan: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
	sort_order: fc.integer({ min: 0, max: 100 }),
	created_at: fc.date().map(d => d.toISOString()),
	updated_at: fc.date().map(d => d.toISOString())
});

const sessionArb = fc.record({
	id: fc.uuid(),
	lecturer_id: fc.option(fc.uuid(), { nil: null }),
	bulan: fc.integer({ min: 1, max: 12 }),
	tahun: fc.integer({ min: 2024, max: 2030 }),
	minggu: fc.integer({ min: 1, max: 5 }),
	hari: hariArb,
	jenis_kuliah: jenisKuliahArb,
	is_active: fc.boolean(),
	created_at: fc.date().map(d => d.toISOString()),
	updated_at: fc.date().map(d => d.toISOString())
});

const sessionWithLecturerArb = fc.record({
	id: fc.uuid(),
	lecturer_id: fc.uuid(),
	bulan: fc.integer({ min: 1, max: 12 }),
	tahun: fc.integer({ min: 2024, max: 2030 }),
	minggu: fc.integer({ min: 1, max: 5 }),
	hari: hariArb,
	jenis_kuliah: jenisKuliahArb,
	is_active: fc.boolean(),
	created_at: fc.date().map(d => d.toISOString()),
	updated_at: fc.date().map(d => d.toISOString()),
	lecturer: lecturerArb
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 2: Sessions Grouped By Week Correctly**
 * **Validates: Requirements 2.1, 8.4**
 * 
 * For any set of lecture sessions with varying week numbers (1-5), when grouped for display,
 * each session SHALL appear in exactly one week group matching its minggu field,
 * and weeks SHALL be ordered 1 through 5.
 */
describe('Property 2: Sessions Grouped By Week Correctly', () => {
	it('should group sessions by their minggu field', () => {
		fc.assert(
			fc.property(fc.array(sessionWithLecturerArb, { minLength: 0, maxLength: 20 }), (sessions) => {
				const grouped = groupSessionsByWeek(sessions);

				// Check all weeks 1-5 exist
				for (let week = 1; week <= 5; week++) {
					expect(grouped[week]).toBeDefined();
					expect(grouped[week].sessions).toBeDefined();
				}

				// Check each session appears in exactly one week matching its minggu
				for (const session of sessions) {
					const weekGroup = grouped[session.minggu];
					const found = weekGroup.sessions.filter(s => s.id === session.id);
					expect(found.length).toBe(1);

					// Check it doesn't appear in other weeks
					for (let week = 1; week <= 5; week++) {
						if (week !== session.minggu) {
							const notFound = grouped[week].sessions.filter(s => s.id === session.id);
							expect(notFound.length).toBe(0);
						}
					}
				}
			}),
			{ numRuns: 100 }
		);
	});

	it('should preserve all sessions (no data loss)', () => {
		fc.assert(
			fc.property(fc.array(sessionWithLecturerArb, { minLength: 0, maxLength: 20 }), (sessions) => {
				const grouped = groupSessionsByWeek(sessions);

				// Count total sessions in grouped result
				let totalGrouped = 0;
				for (let week = 1; week <= 5; week++) {
					totalGrouped += grouped[week].sessions.length;
				}

				expect(totalGrouped).toBe(sessions.length);
			}),
			{ numRuns: 100 }
		);
	});

	it('should handle empty sessions array', () => {
		const grouped = groupSessionsByWeek([]);
		
		for (let week = 1; week <= 5; week++) {
			expect(grouped[week]).toBeDefined();
			expect(grouped[week].sessions).toHaveLength(0);
		}
	});
});

/**
 * **Feature: sistem-penilaian-kuliah, Property 3: Lecturer Card Contains Required Information**
 * **Validates: Requirements 2.2**
 * 
 * For any lecturer card rendered from a LectureSession and Lecturer pair,
 * the rendered output SHALL contain the lecturer's nama, gambar_url (or placeholder),
 * jenis_kuliah, and hari.
 */
describe('Property 3: Lecturer Card Contains Required Information', () => {
	it('should format lecturer card with all required fields', () => {
		fc.assert(
			fc.property(sessionWithLecturerArb, (session) => {
				const cardData = formatLecturerCardData(session);

				// All required fields must be present
				expect(cardData).toHaveProperty('nama');
				expect(cardData).toHaveProperty('gambar_url');
				expect(cardData).toHaveProperty('jenis_kuliah');
				expect(cardData).toHaveProperty('hari');

				// nama should be non-empty string
				expect(typeof cardData.nama).toBe('string');
				expect(cardData.nama.length).toBeGreaterThan(0);

				// jenis_kuliah should be Subuh or Maghrib
				expect(['Subuh', 'Maghrib']).toContain(cardData.jenis_kuliah);

				// hari should be valid day
				expect(['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad']).toContain(cardData.hari);
			}),
			{ numRuns: 100 }
		);
	});

	it('should detect sessions with required lecturer info', () => {
		fc.assert(
			fc.property(sessionWithLecturerArb, (session) => {
				const hasInfo = hasRequiredLecturerInfo(session);
				
				// Sessions with valid lecturer should have required info
				if (session.lecturer && session.lecturer.nama && session.lecturer.nama.trim().length > 0) {
					expect(hasInfo).toBe(true);
				}
			}),
			{ numRuns: 100 }
		);
	});

	it('should handle sessions without lecturer', () => {
		const sessionWithoutLecturer: LectureSession & { lecturer?: Lecturer | null } = {
			id: 'test-id',
			lecturer_id: null,
			bulan: 1,
			tahun: 2024,
			minggu: 1,
			hari: 'Isnin',
			jenis_kuliah: 'Subuh',
			is_active: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			lecturer: undefined
		};

		const cardData = formatLecturerCardData(sessionWithoutLecturer);
		
		// Should have fallback values
		expect(cardData.nama).toBe('Penceramah');
		expect(cardData.gambar_url).toBeNull();
		expect(cardData.jenis_kuliah).toBe('Subuh');
		expect(cardData.hari).toBe('Isnin');
	});
});
