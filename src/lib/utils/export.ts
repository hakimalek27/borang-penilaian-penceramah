import type { Evaluation } from '$lib/types/database';

export interface LecturerSummary {
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

export interface ReportSummary {
	period: string;
	totalEvaluations: number;
	totalLecturers: number;
	averageScore: number;
	topPerformer?: string;
	needsAttention?: string;
	strengths: string[];
	improvements: string[];
}

/**
 * Generates CSV content from evaluations
 */
export function generateCsv(
	evaluations: Evaluation[],
	lecturerNames: Record<string, string>
): string {
	const headers = [
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
		'Purata',
		'Gred',
		'Komen Penceramah',
		'Cadangan Masjid'
	];

	const rows = evaluations.map(e => {
		const avgScore = (e.q1_tajuk + e.q2_ilmu + e.q3_penyampaian + e.q4_masa) / 4;
		const grade = getGrade(avgScore);
		return [
			escapeCsvField(e.nama_penilai),
			e.umur,
			escapeCsvField(e.alamat),
			e.tarikh_penilaian,
			escapeCsvField(lecturerNames[e.lecturer_id || ''] || 'Unknown'),
			e.session?.minggu || '',
			e.session?.jenis_kuliah || '',
			e.q1_tajuk,
			e.q2_ilmu,
			e.q3_penyampaian,
			e.q4_masa,
			avgScore.toFixed(2),
			grade,
			escapeCsvField(e.komen_penceramah || ''),
			escapeCsvField(e.cadangan_masjid || '')
		].join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}

/**
 * Get grade based on score
 */
export function getGrade(score: number): string {
	if (score >= 3.5) return 'A - Cemerlang';
	if (score >= 3.0) return 'B - Baik';
	if (score >= 2.5) return 'C - Sederhana';
	if (score >= 2.0) return 'D - Perlu Perhatian';
	return 'E - Kritikal';
}

/**
 * Generates lecturer summary CSV
 */
export function generateLecturerSummaryCsv(lecturers: LecturerSummary[]): string {
	const headers = [
		'Penceramah',
		'Tajuk (Q1)',
		'Ilmu (Q2)',
		'Penyampaian (Q3)',
		'Masa (Q4)',
		'Purata Keseluruhan',
		'Gred',
		'Bil. Penilaian',
		'Trend',
		'Tahap Risiko'
	];

	const rows = lecturers.map(l => {
		const grade = getGrade(l.avgOverall);
		const trendLabel = l.trend === 'up' ? 'Meningkat' : l.trend === 'down' ? 'Menurun' : 'Stabil';
		const riskLabel = l.riskLevel === 'high' ? 'Tinggi' : l.riskLevel === 'medium' ? 'Sederhana' : 'Rendah';
		return [
			escapeCsvField(l.lecturerName),
			l.avgQ1.toFixed(2),
			l.avgQ2.toFixed(2),
			l.avgQ3.toFixed(2),
			l.avgQ4.toFixed(2),
			l.avgOverall.toFixed(2),
			grade,
			l.totalEvaluations,
			trendLabel,
			riskLabel
		].join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates executive summary CSV
 */
export function generateExecutiveSummaryCsv(summary: ReportSummary): string {
	const lines = [
		'LAPORAN RINGKASAN EKSEKUTIF',
		'',
		`Tempoh,${escapeCsvField(summary.period)}`,
		`Jumlah Penilaian,${summary.totalEvaluations}`,
		`Jumlah Penceramah,${summary.totalLecturers}`,
		`Purata Skor Keseluruhan,${summary.averageScore.toFixed(2)}`,
		`Gred Keseluruhan,${getGrade(summary.averageScore)}`,
		'',
		'PRESTASI',
		`Prestasi Terbaik,${escapeCsvField(summary.topPerformer || '-')}`,
		`Perlu Perhatian,${escapeCsvField(summary.needsAttention || '-')}`,
		'',
		'KEKUATAN',
		...summary.strengths.map((s, i) => `${i + 1},${escapeCsvField(s)}`),
		'',
		'BIDANG PENAMBAHBAIKAN',
		...summary.improvements.map((s, i) => `${i + 1},${escapeCsvField(s)}`)
	];

	return lines.join('\n');
}

/**
 * Generates comparison CSV between periods
 */
export function generateComparisonCsv(
	currentPeriod: { label: string; data: LecturerSummary[] },
	previousPeriod: { label: string; data: LecturerSummary[] }
): string {
	const headers = [
		'Penceramah',
		`Purata (${currentPeriod.label})`,
		`Purata (${previousPeriod.label})`,
		'Perubahan',
		'Trend'
	];

	// Create map of previous period scores
	const prevScores = new Map(previousPeriod.data.map(l => [l.lecturerName, l.avgOverall]));

	const rows = currentPeriod.data.map(l => {
		const prevScore = prevScores.get(l.lecturerName);
		const change = prevScore !== undefined ? l.avgOverall - prevScore : 0;
		const changeStr = prevScore !== undefined ? (change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2)) : 'Baru';
		const trend = change > 0.1 ? 'Meningkat' : change < -0.1 ? 'Menurun' : 'Stabil';
		return [
			escapeCsvField(l.lecturerName),
			l.avgOverall.toFixed(2),
			prevScore?.toFixed(2) || '-',
			changeStr,
			trend
		].join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}

/**
 * Escapes a field for CSV format
 */
export function escapeCsvField(field: string): string {
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

/**
 * Downloads CSV content as a file
 */
export function downloadCsv(content: string, filename: string): void {
	const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Checks if CSV export contains all required fields
 */
export function validateCsvExport(
	csv: string,
	evaluations: Evaluation[]
): boolean {
	const lines = csv.split('\n');
	
	// Check header
	const headers = lines[0];
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
		'Komen Penceramah',
		'Cadangan Masjid'
	];

	for (const header of requiredHeaders) {
		if (!headers.includes(header)) {
			return false;
		}
	}

	// Check row count (header + data rows)
	if (lines.length !== evaluations.length + 1) {
		return false;
	}

	return true;
}
