/**
 * Analytics utility for generating insights and recommendations
 */
import type { LecturerSummary, ReportSummary } from './export';

export interface AnalyticsInput {
	evaluations: Array<{
		q1_tajuk: number;
		q2_ilmu: number;
		q3_penyampaian: number;
		q4_masa: number;
		cadangan_teruskan: boolean;
		lecturer_id?: string;
	}>;
	lecturerScores: LecturerSummary[];
	period: string;
}

export interface AnalyticsResult {
	summary: ReportSummary;
	insights: {
		topPerformer?: { name: string; score: number };
		needsAttention?: { name: string; score: number };
		strengths: string[];
		improvements: string[];
		recommendations: string[];
		keyFindings: string[];
	};
	riskAssessment: Array<{
		lecturerName: string;
		riskLevel: 'low' | 'medium' | 'high';
		factors: string[];
	}>;
}

/**
 * Generate comprehensive analytics from evaluation data
 */
export function generateAnalytics(input: AnalyticsInput): AnalyticsResult {
	const { evaluations, lecturerScores, period } = input;
	
	// Calculate overall statistics
	const totalEvaluations = evaluations.length;
	const totalLecturers = lecturerScores.length;
	
	const avgScore = lecturerScores.length > 0
		? lecturerScores.reduce((sum, l) => sum + l.avgOverall, 0) / lecturerScores.length
		: 0;
	
	const recommendationYes = evaluations.filter(e => e.cadangan_teruskan).length;
	const recommendationYesPercent = totalEvaluations > 0 
		? (recommendationYes / totalEvaluations) * 100 
		: 0;

	// Find top performer and needs attention
	const sortedByScore = [...lecturerScores].sort((a, b) => b.avgOverall - a.avgOverall);
	const topPerformer = sortedByScore[0];
	const needsAttention = sortedByScore[sortedByScore.length - 1];

	// Analyze criteria scores
	const criteriaAnalysis = analyzeCriteria(lecturerScores);
	
	// Generate insights
	const strengths = generateStrengths(criteriaAnalysis, avgScore, recommendationYesPercent);
	const improvements = generateImprovements(criteriaAnalysis, avgScore, recommendationYesPercent);
	const recommendations = generateRecommendations(criteriaAnalysis, lecturerScores);
	const keyFindings = generateKeyFindings(totalEvaluations, avgScore, recommendationYesPercent, lecturerScores);

	// Risk assessment
	const riskAssessment = assessRisks(lecturerScores);

	return {
		summary: {
			period,
			totalEvaluations,
			totalLecturers,
			averageScore: avgScore,
			recommendationYesPercent,
			topPerformer: topPerformer?.lecturerName,
			needsAttention: needsAttention?.avgOverall < 2.5 ? needsAttention?.lecturerName : undefined,
			strengths,
			improvements
		},
		insights: {
			topPerformer: topPerformer ? { name: topPerformer.lecturerName, score: topPerformer.avgOverall } : undefined,
			needsAttention: needsAttention?.avgOverall < 2.5 
				? { name: needsAttention.lecturerName, score: needsAttention.avgOverall } 
				: undefined,
			strengths,
			improvements,
			recommendations,
			keyFindings
		},
		riskAssessment
	};
}

interface CriteriaAnalysis {
	avgQ1: number;
	avgQ2: number;
	avgQ3: number;
	avgQ4: number;
	strongest: { name: string; score: number };
	weakest: { name: string; score: number };
}

function analyzeCriteria(lecturerScores: LecturerSummary[]): CriteriaAnalysis {
	if (lecturerScores.length === 0) {
		return {
			avgQ1: 0, avgQ2: 0, avgQ3: 0, avgQ4: 0,
			strongest: { name: 'Tiada', score: 0 },
			weakest: { name: 'Tiada', score: 0 }
		};
	}

	const avgQ1 = lecturerScores.reduce((sum, l) => sum + l.avgQ1, 0) / lecturerScores.length;
	const avgQ2 = lecturerScores.reduce((sum, l) => sum + l.avgQ2, 0) / lecturerScores.length;
	const avgQ3 = lecturerScores.reduce((sum, l) => sum + l.avgQ3, 0) / lecturerScores.length;
	const avgQ4 = lecturerScores.reduce((sum, l) => sum + l.avgQ4, 0) / lecturerScores.length;

	const criteria = [
		{ name: 'Kesesuaian Tajuk', score: avgQ1 },
		{ name: 'Penguasaan Ilmu', score: avgQ2 },
		{ name: 'Teknik Penyampaian', score: avgQ3 },
		{ name: 'Pengurusan Masa', score: avgQ4 }
	];

	const sorted = [...criteria].sort((a, b) => b.score - a.score);

	return {
		avgQ1, avgQ2, avgQ3, avgQ4,
		strongest: sorted[0],
		weakest: sorted[sorted.length - 1]
	};
}

function generateStrengths(analysis: CriteriaAnalysis, avgScore: number, recPercent: number): string[] {
	const strengths: string[] = [];

	if (avgScore >= 3.5) {
		strengths.push('Prestasi keseluruhan cemerlang dengan purata skor melebihi 3.5');
	} else if (avgScore >= 3.0) {
		strengths.push('Prestasi keseluruhan baik dengan purata skor melebihi 3.0');
	}

	if (recPercent >= 90) {
		strengths.push('Kadar cadangan positif sangat tinggi (>90%)');
	} else if (recPercent >= 80) {
		strengths.push('Kadar cadangan positif tinggi (>80%)');
	}

	if (analysis.strongest.score >= 3.5) {
		strengths.push(`${analysis.strongest.name} menunjukkan prestasi cemerlang (${analysis.strongest.score.toFixed(2)}/4.00)`);
	}

	return strengths;
}

function generateImprovements(analysis: CriteriaAnalysis, avgScore: number, recPercent: number): string[] {
	const improvements: string[] = [];

	if (avgScore < 2.5) {
		improvements.push('Purata skor keseluruhan perlu ditingkatkan segera');
	} else if (avgScore < 3.0) {
		improvements.push('Purata skor keseluruhan boleh diperbaiki');
	}

	if (recPercent < 70) {
		improvements.push('Kadar cadangan positif perlu ditingkatkan');
	}

	if (analysis.weakest.score < 2.5) {
		improvements.push(`${analysis.weakest.name} memerlukan perhatian segera (${analysis.weakest.score.toFixed(2)}/4.00)`);
	} else if (analysis.weakest.score < 3.0) {
		improvements.push(`${analysis.weakest.name} boleh diperbaiki (${analysis.weakest.score.toFixed(2)}/4.00)`);
	}

	return improvements;
}

function generateRecommendations(analysis: CriteriaAnalysis, lecturerScores: LecturerSummary[]): string[] {
	const recommendations: string[] = [];

	// Low performers
	const lowPerformers = lecturerScores.filter(l => l.avgOverall < 2.5);
	if (lowPerformers.length > 0) {
		recommendations.push(`Adakan sesi bimbingan untuk ${lowPerformers.length} penceramah dengan skor rendah`);
	}

	// Criteria-specific recommendations
	if (analysis.avgQ3 < 2.5) {
		recommendations.push('Anjurkan bengkel teknik penyampaian untuk semua penceramah');
	}
	if (analysis.avgQ4 < 2.5) {
		recommendations.push('Sediakan panduan pengurusan masa kuliah');
	}
	if (analysis.avgQ1 < 2.5) {
		recommendations.push('Kaji semula proses pemilihan tajuk kuliah');
	}

	// General recommendations
	if (lecturerScores.length > 0) {
		const avgRecPercent = lecturerScores.reduce((sum, l) => sum + l.recommendationYesPercent, 0) / lecturerScores.length;
		if (avgRecPercent < 70) {
			recommendations.push('Tingkatkan program pembangunan profesional penceramah');
		}
	}

	return recommendations;
}

function generateKeyFindings(totalEval: number, avgScore: number, recPercent: number, lecturerScores: LecturerSummary[]): string[] {
	const findings: string[] = [];

	findings.push(`Sebanyak ${totalEval} penilaian telah dikumpul untuk tempoh ini`);
	findings.push(`Purata skor keseluruhan adalah ${avgScore.toFixed(2)}/4.00`);
	findings.push(`${recPercent.toFixed(1)}% penceramah dicadangkan untuk diteruskan`);

	const highPerformers = lecturerScores.filter(l => l.avgOverall >= 3.5).length;
	const lowPerformers = lecturerScores.filter(l => l.avgOverall < 2.5).length;

	if (highPerformers > 0) {
		findings.push(`${highPerformers} penceramah mencapai prestasi cemerlang (≥3.5)`);
	}
	if (lowPerformers > 0) {
		findings.push(`${lowPerformers} penceramah memerlukan perhatian khusus (<2.5)`);
	}

	return findings;
}

function assessRisks(lecturerScores: LecturerSummary[]): Array<{ lecturerName: string; riskLevel: 'low' | 'medium' | 'high'; factors: string[] }> {
	return lecturerScores.map(l => {
		const factors: string[] = [];
		let riskScore = 0;

		if (l.avgOverall < 2.0) {
			riskScore += 40;
			factors.push('Skor purata sangat rendah');
		} else if (l.avgOverall < 2.5) {
			riskScore += 25;
			factors.push('Skor purata rendah');
		} else if (l.avgOverall < 3.0) {
			riskScore += 10;
			factors.push('Skor purata di bawah paras');
		}

		if (l.recommendationYesPercent < 50) {
			riskScore += 30;
			factors.push('Kadar cadangan positif rendah');
		} else if (l.recommendationYesPercent < 70) {
			riskScore += 15;
			factors.push('Kadar cadangan positif sederhana');
		}

		if (l.totalEvaluations < 3) {
			riskScore += 10;
			factors.push('Bilangan penilaian terlalu sedikit');
		}

		let riskLevel: 'low' | 'medium' | 'high';
		if (riskScore >= 50) {
			riskLevel = 'high';
		} else if (riskScore >= 25) {
			riskLevel = 'medium';
		} else {
			riskLevel = 'low';
		}

		return { lecturerName: l.lecturerName, riskLevel, factors };
	});
}

/**
 * Calculate trend based on historical data
 */
export function calculateTrend(currentScore: number, previousScore: number): 'up' | 'down' | 'stable' {
	const diff = currentScore - previousScore;
	if (diff > 0.1) return 'up';
	if (diff < -0.1) return 'down';
	return 'stable';
}
