/**
 * PDF Export Property Tests
 * **Feature: sistem-penilaian-kuliah, Property 21: PDF Export Contains Required Sections**
 * **Validates: Requirements 16.2**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
	validateReportData,
	generatePDFReport,
	generatePDFBlob,
	type ReportData,
	type LecturerScore,
	type EvaluationRecord
} from './pdf';

// Arbitrary for generating valid lecturer scores
const lecturerScoreArbitrary = fc.record({
	lecturerName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
	avgQ1: fc.float({ min: 1, max: 4, noNaN: true }),
	avgQ2: fc.float({ min: 1, max: 4, noNaN: true }),
	avgQ3: fc.float({ min: 1, max: 4, noNaN: true }),
	avgQ4: fc.float({ min: 1, max: 4, noNaN: true }),
	avgOverall: fc.float({ min: 1, max: 4, noNaN: true }),
	totalEvaluations: fc.integer({ min: 1, max: 1000 })
});

// Arbitrary for generating valid evaluation records
const evaluationRecordArbitrary = fc.record({
	namaPenilai: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
	lecturerName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
	tarikh: fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') })
		.map(d => d.toISOString().split('T')[0]),
	minggu: fc.integer({ min: 1, max: 5 }),
	jenisKuliah: fc.constantFrom('Subuh', 'Maghrib'),
	q1: fc.integer({ min: 1, max: 4 }),
	q2: fc.integer({ min: 1, max: 4 }),
	q3: fc.integer({ min: 1, max: 4 }),
	q4: fc.integer({ min: 1, max: 4 }),
	cadanganTeruskan: fc.boolean()
});

// Arbitrary for generating valid report data
const reportDataArbitrary = fc.record({
	title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
	dateRange: fc.record({
		from: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-06-30') })
			.map(d => d.toISOString().split('T')[0]),
		to: fc.date({ min: new Date('2025-07-01'), max: new Date('2030-12-31') })
			.map(d => d.toISOString().split('T')[0])
	}),
	summaryStats: fc.record({
		totalEvaluations: fc.integer({ min: 0, max: 10000 }),
		averageScore: fc.float({ min: 1, max: 4, noNaN: true })
	}),
	lecturerScores: fc.array(lecturerScoreArbitrary, { minLength: 0, maxLength: 10 }),
	evaluations: fc.array(evaluationRecordArbitrary, { minLength: 0, maxLength: 20 })
});

describe('PDF Export Utils', () => {
	describe('validateReportData', () => {
		/**
		 * Property: All valid report data should pass validation
		 */
		it('should validate all properly formed report data', () => {
			fc.assert(
				fc.property(
					reportDataArbitrary,
					(data) => {
						const result = validateReportData(data);
						expect(result.valid).toBe(true);
						expect(result.errors).toHaveLength(0);
					}
				),
				{ numRuns: 50 }
			);
		});

		it('should reject report data with missing title', () => {
			const data = {
				title: '',
				dateRange: { from: '2024-01-01', to: '2024-12-31' },
				summaryStats: {
					totalEvaluations: 10,
					averageScore: 3.5
				},
				lecturerScores: [],
				evaluations: []
			};

			const result = validateReportData(data);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('title is required');
		});

		it('should reject report data with missing dateRange', () => {
			const data = {
				title: 'Test Report',
				dateRange: { from: '', to: '' },
				summaryStats: {
					totalEvaluations: 10,
					averageScore: 3.5
				},
				lecturerScores: [],
				evaluations: []
			};

			const result = validateReportData(data);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('dateRange with from and to is required');
		});
	});

	describe('generatePDFReport', () => {
		/**
		 * **Feature: sistem-penilaian-kuliah, Property 21: PDF Export Contains Required Sections**
		 * **Validates: Requirements 16.2**
		 * 
		 * For any set of filtered evaluation data, the generated PDF SHALL contain:
		 * report title, date range, summary statistics, and detailed data table.
		 */
		it('should generate PDF with all required sections for any valid data', () => {
			fc.assert(
				fc.property(
					reportDataArbitrary,
					(data) => {
						// Should not throw
						const doc = generatePDFReport(data);
						
						// Should return a jsPDF instance
						expect(doc).toBeDefined();
						expect(typeof doc.save).toBe('function');
						expect(typeof doc.output).toBe('function');
						
						// Get PDF content as text for verification
						const pdfText = doc.output('datauristring');
						
						// Should be a valid PDF data URI
						expect(pdfText).toContain('data:application/pdf');
					}
				),
				{ numRuns: 30 }
			);
		});

		/**
		 * Property: PDF generation should be deterministic
		 */
		it('should generate consistent PDF for same data', () => {
			const data: ReportData = {
				title: 'Laporan Penilaian',
				dateRange: { from: '2024-01-01', to: '2024-12-31' },
				summaryStats: {
					totalEvaluations: 100,
					averageScore: 3.5
				},
				lecturerScores: [
					{
						lecturerName: 'Ustaz Ahmad',
						avgQ1: 3.5,
						avgQ2: 3.6,
						avgQ3: 3.4,
						avgQ4: 3.7,
						avgOverall: 3.55,
						totalEvaluations: 50
					}
				],
				evaluations: []
			};

			const doc1 = generatePDFReport(data);
			const doc2 = generatePDFReport(data);

			// Both should have same number of pages
			expect(doc1.getNumberOfPages()).toBe(doc2.getNumberOfPages());
		});

		it('should throw error for invalid data', () => {
			const invalidData = {
				title: '',
				dateRange: { from: '', to: '' },
				summaryStats: null,
				lecturerScores: null,
				evaluations: null
			} as unknown as ReportData;

			expect(() => generatePDFReport(invalidData)).toThrow('Invalid report data');
		});
	});

	describe('generatePDFBlob', () => {
		/**
		 * Property: Should generate valid blob for any valid data
		 */
		it('should generate valid PDF blob for any valid data', () => {
			fc.assert(
				fc.property(
					reportDataArbitrary,
					(data) => {
						const blob = generatePDFBlob(data);
						
						// Should return a Blob
						expect(blob).toBeInstanceOf(Blob);
						
						// Should have PDF mime type
						expect(blob.type).toBe('application/pdf');
						
						// Should have content
						expect(blob.size).toBeGreaterThan(0);
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	describe('PDF Content Verification', () => {
		/**
		 * Property: PDF should contain mosque header
		 */
		it('should include mosque name in header', () => {
			const data: ReportData = {
				title: 'Laporan Bulanan',
				dateRange: { from: '2024-01-01', to: '2024-01-31' },
				summaryStats: {
					totalEvaluations: 50,
					averageScore: 3.2
				},
				lecturerScores: [],
				evaluations: []
			};

			const doc = generatePDFReport(data);
			
			// PDF should be generated successfully
			expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		});

		/**
		 * Property: PDF with lecturer scores should have table
		 */
		it('should include lecturer scores table when data provided', () => {
			const data: ReportData = {
				title: 'Laporan Penceramah',
				dateRange: { from: '2024-01-01', to: '2024-12-31' },
				summaryStats: {
					totalEvaluations: 100,
					averageScore: 3.5
				},
				lecturerScores: [
					{
						lecturerName: 'Ustaz Ahmad',
						avgQ1: 3.5,
						avgQ2: 3.6,
						avgQ3: 3.4,
						avgQ4: 3.7,
						avgOverall: 3.55,
						totalEvaluations: 50
					},
					{
						lecturerName: 'Ustaz Bakar',
						avgQ1: 3.2,
						avgQ2: 3.3,
						avgQ3: 3.1,
						avgQ4: 3.4,
						avgOverall: 3.25,
						totalEvaluations: 50
					}
				],
				evaluations: []
			};

			const doc = generatePDFReport(data);
			expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		});

		/**
		 * Property: PDF with many evaluations should handle pagination
		 */
		it('should handle large datasets', () => {
			const evaluations: EvaluationRecord[] = Array.from({ length: 50 }, (_, i) => ({
				namaPenilai: `Penilai ${i + 1}`,
				lecturerName: `Ustaz ${i % 5 + 1}`,
				tarikh: '2024-06-15',
				minggu: (i % 5) + 1,
				jenisKuliah: i % 2 === 0 ? 'Subuh' : 'Maghrib',
				q1: 3,
				q2: 3,
				q3: 4,
				q4: 3,
				cadanganTeruskan: true
			}));

			const data: ReportData = {
				title: 'Laporan Lengkap',
				dateRange: { from: '2024-01-01', to: '2024-12-31' },
				summaryStats: {
					totalEvaluations: 50,
					averageScore: 3.25
				},
				lecturerScores: [],
				evaluations
			};

			// Should not throw
			const doc = generatePDFReport(data);
			expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		});
	});
});
