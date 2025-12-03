/**
 * PDF Export Utility
 * Generates PDF reports for evaluation data
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
	title: string;
	dateRange: { from: string; to: string };
	summaryStats: {
		totalEvaluations: number;
		averageScore: number;
		recommendationYes: number;
		recommendationNo: number;
	};
	lecturerScores: LecturerScore[];
	evaluations: EvaluationRecord[];
	insights?: ReportInsights;
	comparison?: ComparisonData;
}

export interface LecturerScore {
	lecturerName: string;
	avgQ1: number;
	avgQ2: number;
	avgQ3: number;
	avgQ4: number;
	avgOverall: number;
	totalEvaluations: number;
	trend?: 'up' | 'down' | 'stable';
	riskLevel?: 'low' | 'medium' | 'high';
}

export interface EvaluationRecord {
	namaPenilai: string;
	lecturerName: string;
	tarikh: string;
	minggu: number;
	jenisKuliah: string;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
	cadanganTeruskan: boolean;
}

export interface ReportInsights {
	topPerformer?: { name: string; score: number };
	needsAttention?: { name: string; score: number };
	strengths: string[];
	improvements: string[];
	recommendations: string[];
	keyFindings: string[];
}

export interface ComparisonData {
	previousPeriod?: {
		totalEvaluations: number;
		averageScore: number;
		recommendationYesPercent: number;
	};
	changePercent?: {
		evaluations: number;
		score: number;
		recommendation: number;
	};
}

/**
 * Validate report data has all required sections
 */
export function validateReportData(data: ReportData): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!data.title || typeof data.title !== 'string') {
		errors.push('title is required');
	}
	if (!data.dateRange || !data.dateRange.from || !data.dateRange.to) {
		errors.push('dateRange with from and to is required');
	}
	if (!data.summaryStats) {
		errors.push('summaryStats is required');
	} else {
		if (typeof data.summaryStats.totalEvaluations !== 'number') {
			errors.push('summaryStats.totalEvaluations is required');
		}
		if (typeof data.summaryStats.averageScore !== 'number') {
			errors.push('summaryStats.averageScore is required');
		}
		if (typeof data.summaryStats.recommendationYes !== 'number') {
			errors.push('summaryStats.recommendationYes is required');
		}
		if (typeof data.summaryStats.recommendationNo !== 'number') {
			errors.push('summaryStats.recommendationNo is required');
		}
	}
	if (!Array.isArray(data.lecturerScores)) {
		errors.push('lecturerScores array is required');
	}
	if (!Array.isArray(data.evaluations)) {
		errors.push('evaluations array is required');
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Check if PDF contains required sections
 */
export function checkPDFSections(pdfContent: string): {
	hasTitle: boolean;
	hasDateRange: boolean;
	hasSummaryStats: boolean;
	hasDataTable: boolean;
} {
	return {
		hasTitle: pdfContent.includes('Laporan') || pdfContent.includes('Report'),
		hasDateRange: /\d{4}/.test(pdfContent), // Contains year
		hasSummaryStats: pdfContent.includes('Jumlah') || pdfContent.includes('Purata'),
		hasDataTable: pdfContent.includes('Penceramah') || pdfContent.includes('Skor')
	};
}

/**
 * Generate PDF report
 */
export function generatePDFReport(data: ReportData): jsPDF {
	const validation = validateReportData(data);
	if (!validation.valid) {
		throw new Error(`Invalid report data: ${validation.errors.join(', ')}`);
	}

	const doc = new jsPDF();
	let yPos = 20;

	// Header - Mosque name
	doc.setFontSize(16);
	doc.setFont('helvetica', 'bold');
	doc.text('Masjid Al-Muttaqin Wangsa Melawati', 105, yPos, { align: 'center' });
	yPos += 8;

	// Title
	doc.setFontSize(14);
	doc.text(data.title, 105, yPos, { align: 'center' });
	yPos += 8;

	// Date range
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.text(`Tempoh: ${data.dateRange.from} - ${data.dateRange.to}`, 105, yPos, { align: 'center' });
	yPos += 15;

	// Summary Statistics Box
	doc.setFillColor(240, 247, 241);
	doc.rect(14, yPos - 5, 182, 45, 'F');
	
	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.text('Ringkasan Eksekutif', 20, yPos + 3);
	
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	
	const stats = data.summaryStats;
	const col1X = 20;
	const col2X = 110;
	
	doc.text(`Jumlah Penilaian: ${stats.totalEvaluations}`, col1X, yPos + 12);
	doc.text(`Purata Skor: ${stats.averageScore.toFixed(2)}/4.00`, col2X, yPos + 12);
	
	const totalRec = stats.recommendationYes + stats.recommendationNo;
	const yesPercent = totalRec > 0 ? ((stats.recommendationYes / totalRec) * 100).toFixed(1) : '0';
	const noPercent = totalRec > 0 ? ((stats.recommendationNo / totalRec) * 100).toFixed(1) : '0';
	
	doc.text(`Cadangan Ya: ${stats.recommendationYes} (${yesPercent}%)`, col1X, yPos + 20);
	doc.text(`Cadangan Tidak: ${stats.recommendationNo} (${noPercent}%)`, col2X, yPos + 20);

	// Add comparison with previous period if available
	if (data.comparison?.changePercent) {
		const change = data.comparison.changePercent;
		const scoreChange = change.score >= 0 ? `+${change.score.toFixed(1)}%` : `${change.score.toFixed(1)}%`;
		doc.text(`Perubahan Skor: ${scoreChange} berbanding tempoh sebelum`, col1X, yPos + 28);
	}

	// Add top performer and needs attention
	if (data.insights?.topPerformer) {
		doc.text(`Prestasi Terbaik: ${data.insights.topPerformer.name} (${data.insights.topPerformer.score.toFixed(2)})`, col1X, yPos + 36);
	}
	if (data.insights?.needsAttention) {
		doc.text(`Perlu Perhatian: ${data.insights.needsAttention.name} (${data.insights.needsAttention.score.toFixed(2)})`, col2X, yPos + 36);
	}
	
	yPos += 55;

	// Insights Section
	if (data.insights && (data.insights.keyFindings.length > 0 || data.insights.recommendations.length > 0)) {
		doc.setFillColor(255, 250, 240);
		doc.rect(14, yPos - 5, 182, 40, 'F');
		
		doc.setFontSize(11);
		doc.setFont('helvetica', 'bold');
		doc.text('Penemuan & Cadangan', 20, yPos + 3);
		
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		
		let insightY = yPos + 12;
		
		// Key findings
		if (data.insights.keyFindings.length > 0) {
			data.insights.keyFindings.slice(0, 2).forEach((finding, i) => {
				doc.text(`• ${finding}`, 20, insightY);
				insightY += 6;
			});
		}
		
		// Recommendations
		if (data.insights.recommendations.length > 0) {
			doc.setFont('helvetica', 'bold');
			doc.text('Cadangan:', 20, insightY);
			doc.setFont('helvetica', 'normal');
			insightY += 6;
			data.insights.recommendations.slice(0, 2).forEach((rec, i) => {
				doc.text(`${i + 1}. ${rec}`, 25, insightY);
				insightY += 6;
			});
		}
		
		yPos += 50;
	}

	// Lecturer Scores Table
	if (data.lecturerScores.length > 0) {
		doc.setFontSize(11);
		doc.setFont('helvetica', 'bold');
		doc.text('Skor Penceramah', 14, yPos);
		yPos += 5;

		autoTable(doc, {
			startY: yPos,
			head: [['Penceramah', 'Q1', 'Q2', 'Q3', 'Q4', 'Purata', 'Bil.', 'Status']],
			body: data.lecturerScores.map(l => {
				const riskLabel = l.riskLevel === 'high' ? 'Perhatian' : l.riskLevel === 'medium' ? 'Sederhana' : 'Baik';
				return [
					l.lecturerName,
					l.avgQ1.toFixed(2),
					l.avgQ2.toFixed(2),
					l.avgQ3.toFixed(2),
					l.avgQ4.toFixed(2),
					l.avgOverall.toFixed(2),
					l.totalEvaluations.toString(),
					riskLabel
				];
			}),
			theme: 'striped',
			headStyles: { fillColor: [26, 95, 42] },
			styles: { fontSize: 9 },
			columnStyles: {
				0: { cellWidth: 40 },
				1: { cellWidth: 16, halign: 'center' },
				2: { cellWidth: 16, halign: 'center' },
				3: { cellWidth: 16, halign: 'center' },
				4: { cellWidth: 16, halign: 'center' },
				5: { cellWidth: 18, halign: 'center' },
				6: { cellWidth: 14, halign: 'center' },
				7: { cellWidth: 28, halign: 'center' }
			},
			didParseCell: (hookData) => {
				// Highlight low scores in red
				if (hookData.section === 'body' && hookData.column.index === 5) {
					const score = parseFloat(hookData.cell.raw as string);
					if (score < 2.5) {
						hookData.cell.styles.textColor = [220, 53, 69];
						hookData.cell.styles.fontStyle = 'bold';
					} else if (score >= 3.5) {
						hookData.cell.styles.textColor = [26, 95, 42];
						hookData.cell.styles.fontStyle = 'bold';
					}
				}
			}
		});

		// Get the final Y position after the table
		yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
	}

	// Detailed Evaluations Table (if space allows)
	if (data.evaluations.length > 0 && yPos < 200) {
		doc.setFontSize(11);
		doc.setFont('helvetica', 'bold');
		doc.text('Senarai Penilaian', 14, yPos);
		yPos += 5;

		autoTable(doc, {
			startY: yPos,
			head: [['Penilai', 'Penceramah', 'Tarikh', 'Minggu', 'Jenis', 'Skor', 'Cadangan']],
			body: data.evaluations.slice(0, 20).map(e => [
				e.namaPenilai.substring(0, 15),
				e.lecturerName.substring(0, 15),
				e.tarikh,
				`M${e.minggu}`,
				e.jenisKuliah,
				((e.q1 + e.q2 + e.q3 + e.q4) / 4).toFixed(2),
				e.cadanganTeruskan ? 'Ya' : 'Tidak'
			]),
			theme: 'striped',
			headStyles: { fillColor: [26, 95, 42] },
			styles: { fontSize: 8 },
			columnStyles: {
				0: { cellWidth: 30 },
				1: { cellWidth: 30 },
				2: { cellWidth: 22 },
				3: { cellWidth: 15, halign: 'center' },
				4: { cellWidth: 20 },
				5: { cellWidth: 18, halign: 'center' },
				6: { cellWidth: 20, halign: 'center' }
			}
		});

		if (data.evaluations.length > 20) {
			const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
			doc.setFontSize(8);
			doc.setFont('helvetica', 'italic');
			doc.text(`... dan ${data.evaluations.length - 20} lagi rekod`, 14, finalY);
		}
	}

	// Footer
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.text(
			`Dijana pada: ${new Date().toLocaleDateString('ms-MY')} | Halaman ${i} / ${pageCount}`,
			105,
			285,
			{ align: 'center' }
		);
	}

	return doc;
}

/**
 * Generate and download PDF report
 */
export function downloadPDFReport(data: ReportData, filename?: string): void {
	const doc = generatePDFReport(data);
	const defaultFilename = `laporan-penilaian-${data.dateRange.from}-${data.dateRange.to}.pdf`;
	doc.save(filename || defaultFilename);
}

/**
 * Generate PDF as blob for preview or other uses
 */
export function generatePDFBlob(data: ReportData): Blob {
	const doc = generatePDFReport(data);
	return doc.output('blob');
}
