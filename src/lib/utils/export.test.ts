import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateCsv, escapeCsvField, validateCsvExport } from './export';
import type { Evaluation, LectureSession } from '$lib/types/database';

// Generators
const validRatingArb = fc.integer({ min: 1, max: 4 });

const sessionArb = fc.record({
	id: fc.uuid(),
	lecturer_id: fc.uuid(),
	bulan: fc.integer({ min: 1, max: 12 }),
	tahun: fc.integer({ min: 2024, max: 2030 }),
	minggu: fc.integer({ min: 1, max: 5 }),
	hari: fc.constantFrom('Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad') as fc.Arbitrary<'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu' | 'Ahad'>,
	jenis_kuliah: fc.constantFrom('Subuh', 'Maghrib') as fc.Arbitrary<'Subuh' | 'Maghrib'>,
	is_active: fc.boolean(),
	created_at: fc.constant(new Date().toISOString()),
	updated_at: fc.constant(new Date().toISOString())
});

const evaluationArb = fc.record({
	id: fc.uuid(),
	session_id: fc.uuid(),
	lecturer_id: fc.uuid(),
	nama_penilai: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	umur: fc.integer({ min: 1, max: 150 }),
	alamat: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
	tarikh_penilaian: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
		.map(d => d.toISOString().split('T')[0]),
	q1_tajuk: validRatingArb,
	q2_ilmu: validRatingArb,
	q3_penyampaian: validRatingArb,
	q4_masa: validRatingArb,
	cadangan_teruskan: fc.boolean(),
	komen_penceramah: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
	cadangan_masjid: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
	created_at: fc.constant(new Date().toISOString())
});

const evaluationWithSessionArb = fc.tuple(evaluationArb, sessionArb).map(([evaluation, session]) => ({
	...evaluation,
	session
} as Evaluation));

/**
 * **Feature: sistem-penilaian-kuliah, Property 16: CSV Export Completeness**
 * **Validates: Requirements 11.1, 11.3**
 * 
 * For any filtered evaluation data exported to CSV, the output SHALL contain one row per evaluation
 * with all required fields: nama_penilai, umur, alamat, tarikh_penilaian, lecturer nama, minggu,
 * jenis_kuliah, q1-q4 ratings, cadangan_teruskan, komen_penceramah, cadangan_masjid.
 */
describe('Property 16: CSV Export Completeness', () => {
	it('should include all required headers in CSV', () => {
		const requiredHeaders = [
			'Nama Penilai',
			'Umur',
			'Alamat',
			'Tarikh Penilaian',
			'Penceramah',
			'Minggu',
			'Jenis Kuliah',
			'Tajuk (Q1)',
			'Ilmu (Q2)',
			'Penyampaian (Q3)',
			'Masa (Q4)',
			'Cadangan Teruskan',
			'Komen Penceramah',
			'Cadangan Masjid'
		];

		const csv = generateCsv([], {});
		const headerLine = csv.split('\n')[0];

		for (const header of requiredHeaders) {
			expect(headerLine).toContain(header);
		}
	});

	it('should generate one row per evaluation', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationWithSessionArb, { minLength: 1, maxLength: 10 }),
				(evaluations) => {
					const lecturerNames: Record<string, string> = {};
					evaluations.forEach(e => {
						if (e.lecturer_id) {
							lecturerNames[e.lecturer_id] = `Penceramah ${e.lecturer_id.slice(0, 4)}`;
						}
					});

					const csv = generateCsv(evaluations, lecturerNames);
					const lines = csv.split('\n');

					// Header + data rows
					expect(lines.length).toBe(evaluations.length + 1);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('should include all evaluation data in each row', () => {
		fc.assert(
			fc.property(evaluationWithSessionArb, (evaluation) => {
				const lecturerNames: Record<string, string> = {
					[evaluation.lecturer_id || '']: 'Test Penceramah'
				};

				const csv = generateCsv([evaluation], lecturerNames);
				const lines = csv.split('\n');
				const dataRow = lines[1];

				// Check required data is present
				expect(dataRow).toContain(evaluation.umur.toString());
				expect(dataRow).toContain(evaluation.tarikh_penilaian);
				expect(dataRow).toContain(evaluation.q1_tajuk.toString());
				expect(dataRow).toContain(evaluation.q2_ilmu.toString());
				expect(dataRow).toContain(evaluation.q3_penyampaian.toString());
				expect(dataRow).toContain(evaluation.q4_masa.toString());
				expect(dataRow).toContain(evaluation.cadangan_teruskan ? 'Ya' : 'Tidak');
			}),
			{ numRuns: 100 }
		);
	});

	it('should validate CSV export correctly', () => {
		fc.assert(
			fc.property(
				fc.array(evaluationWithSessionArb, { minLength: 1, maxLength: 5 }),
				(evaluations) => {
					const lecturerNames: Record<string, string> = {};
					evaluations.forEach(e => {
						if (e.lecturer_id) {
							lecturerNames[e.lecturer_id] = `Penceramah ${e.lecturer_id.slice(0, 4)}`;
						}
					});

					const csv = generateCsv(evaluations, lecturerNames);
					expect(validateCsvExport(csv, evaluations)).toBe(true);
				}
			),
			{ numRuns: 100 }
		);
	});
});

describe('CSV Field Escaping', () => {
	it('should escape fields with commas', () => {
		fc.assert(
			fc.property(
				fc.string().filter(s => s.includes(',')),
				(field) => {
					const escaped = escapeCsvField(field);
					expect(escaped.startsWith('"')).toBe(true);
					expect(escaped.endsWith('"')).toBe(true);
				}
			),
			{ numRuns: 50 }
		);
	});

	it('should escape fields with quotes', () => {
		fc.assert(
			fc.property(
				fc.string().filter(s => s.includes('"')),
				(field) => {
					const escaped = escapeCsvField(field);
					expect(escaped.startsWith('"')).toBe(true);
					expect(escaped.endsWith('"')).toBe(true);
					// Double quotes should be escaped
					expect(escaped.includes('""')).toBe(true);
				}
			),
			{ numRuns: 50 }
		);
	});

	it('should not escape simple fields', () => {
		fc.assert(
			fc.property(
				fc.string().filter(s => !s.includes(',') && !s.includes('"') && !s.includes('\n')),
				(field) => {
					const escaped = escapeCsvField(field);
					expect(escaped).toBe(field);
				}
			),
			{ numRuns: 50 }
		);
	});
});
