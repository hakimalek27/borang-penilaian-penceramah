<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Select } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { generateCsv, downloadCsv, generateLecturerSummaryCsv, generateExecutiveSummaryCsv, type LecturerSummary } from '$lib/utils/export';
	import { downloadPDFReport, type ReportData } from '$lib/utils/pdf';
	import { generateAnalytics } from '$lib/utils/analytics';

	let { data }: { data: PageData } = $props();
	
	let deleteConfirmId = $state<string | null>(null);
	let showExportMenu = $state(false);
	let showIndividualReport = $state(false);

	let selectedMonth = $state(data.filters.month);
	let selectedYear = $state(data.filters.year);
	let selectedWeek = $state<number | null>(data.filters.week);
	let selectedLecturer = $state<string | null>(data.filters.lecturerId);
	let selectedType = $state<string | null>(data.filters.lectureType);

	// Get selected lecturer info for individual report
	const selectedLecturerInfo = $derived(
		selectedLecturer ? data.lecturers.find(l => l.id === selectedLecturer) : null
	);

	// Calculate individual lecturer report data
	const individualReport = $derived(() => {
		if (!selectedLecturer) return null;
		
		const lecturerEvals = data.evaluations.filter(e => e.lecturer_id === selectedLecturer);
		if (lecturerEvals.length === 0) return null;

		const totalResponses = lecturerEvals.length;
		const maxPerQuestion = totalResponses * 4;

		// Sum scores per question
		const q1Total = lecturerEvals.reduce((sum, e) => sum + e.q1_tajuk, 0);
		const q2Total = lecturerEvals.reduce((sum, e) => sum + e.q2_ilmu, 0);
		const q3Total = lecturerEvals.reduce((sum, e) => sum + e.q3_penyampaian, 0);
		const q4Total = lecturerEvals.reduce((sum, e) => sum + e.q4_masa, 0);
		const grandTotal = q1Total + q2Total + q3Total + q4Total;
		const maxTotal = maxPerQuestion * 4;

		// Calculate percentage
		const percentage = maxTotal > 0 ? (grandTotal / maxTotal) * 100 : 0;

		// Determine grade
		let grade: string;
		let gradeColor: string;
		if (percentage >= 76) {
			grade = 'A';
			gradeColor = '#1a5f2a'; // hijau
		} else if (percentage >= 51) {
			grade = 'B';
			gradeColor = '#f0ad4e'; // kuning
		} else if (percentage >= 26) {
			grade = 'C';
			gradeColor = '#fd7e14'; // oren
		} else {
			grade = 'D';
			gradeColor = '#dc3545'; // merah
		}

		// Recommendation stats
		const yesCount = lecturerEvals.filter(e => e.cadangan_teruskan).length;
		const noCount = lecturerEvals.filter(e => !e.cadangan_teruskan).length;
		const yesPercent = totalResponses > 0 ? (yesCount / totalResponses) * 100 : 0;
		const noPercent = totalResponses > 0 ? (noCount / totalResponses) * 100 : 0;

		return {
			totalResponses,
			maxPerQuestion,
			q1: { total: q1Total, max: maxPerQuestion },
			q2: { total: q2Total, max: maxPerQuestion },
			q3: { total: q3Total, max: maxPerQuestion },
			q4: { total: q4Total, max: maxPerQuestion },
			grandTotal,
			maxTotal,
			percentage,
			grade,
			gradeColor,
			recommendation: {
				yes: yesCount,
				no: noCount,
				yesPercent,
				noPercent
			}
		};
	});

	function printIndividualReport() {
		window.print();
	}

	const monthOptions = data.monthNames.map((name, i) => ({ value: i + 1, label: name }));
	const yearOptions = [2024, 2025, 2026, 2027, 2028].map(y => ({ value: y, label: String(y) }));
	const weekOptions = [
		{ value: '', label: 'Semua Minggu' },
		{ value: 1, label: 'Minggu 1' },
		{ value: 2, label: 'Minggu 2' },
		{ value: 3, label: 'Minggu 3' },
		{ value: 4, label: 'Minggu 4' },
		{ value: 5, label: 'Minggu 5' }
	];
	const typeOptions = [
		{ value: '', label: 'Semua Jenis' },
		{ value: 'Subuh', label: 'Kuliah Subuh' },
		{ value: 'Maghrib', label: 'Kuliah Maghrib' },
		{ value: 'Tazkirah Jumaat', label: 'Tazkirah Jumaat' }
	];

	const lecturerOptions = $derived([
		{ value: '', label: 'Semua Penceramah' },
		...data.lecturers.map(l => ({ value: l.id, label: l.nama }))
	]);

	// Create lecturer names map for CSV export
	const lecturerNames = $derived(
		Object.fromEntries(data.lecturers.map(l => [l.id, l.nama]))
	);

	// Generate analytics
	const analytics = $derived(generateAnalytics({
		evaluations: data.evaluations,
		lecturerScores: data.lecturerScores.map(s => ({
			...s,
			recommendationYesPercent: data.evaluations.filter(e => 
				e.lecturer_id === data.lecturers.find(l => l.nama === s.lecturerName)?.id && e.cadangan_teruskan
			).length / Math.max(1, data.evaluations.filter(e => 
				e.lecturer_id === data.lecturers.find(l => l.nama === s.lecturerName)?.id
			).length) * 100
		})),
		period: `${data.monthNames[data.filters.month - 1]} ${data.filters.year}`
	}));

	function applyFilters() {
		const params = new URLSearchParams();
		params.set('month', String(selectedMonth));
		params.set('year', String(selectedYear));
		if (selectedWeek) params.set('week', String(selectedWeek));
		if (selectedLecturer) params.set('lecturer', selectedLecturer);
		if (selectedType) params.set('type', selectedType);
		goto(`/admin/laporan?${params.toString()}`);
	}

	function handleExportCsv(type: 'full' | 'lecturer' | 'summary') {
		const monthName = data.monthNames[data.filters.month - 1];
		let csv: string;
		let filename: string;

		if (type === 'full') {
			csv = generateCsv(data.evaluations, lecturerNames);
			filename = `penilaian_penuh_${monthName}_${data.filters.year}.csv`;
		} else if (type === 'lecturer') {
			const lecturerData: LecturerSummary[] = data.lecturerScores.map(s => ({
				...s,
				recommendationYesPercent: data.evaluations.filter(e => 
					e.lecturer_id === data.lecturers.find(l => l.nama === s.lecturerName)?.id && e.cadangan_teruskan
				).length / Math.max(1, data.evaluations.filter(e => 
					e.lecturer_id === data.lecturers.find(l => l.nama === s.lecturerName)?.id
				).length) * 100,
				trend: 'stable' as const,
				riskLevel: analytics.riskAssessment.find(r => r.lecturerName === s.lecturerName)?.riskLevel || 'low'
			}));
			csv = generateLecturerSummaryCsv(lecturerData);
			filename = `ringkasan_penceramah_${monthName}_${data.filters.year}.csv`;
		} else {
			csv = generateExecutiveSummaryCsv(analytics.summary);
			filename = `ringkasan_eksekutif_${monthName}_${data.filters.year}.csv`;
		}

		downloadCsv(csv, filename);
		showExportMenu = false;
	}

	function handlePrint() {
		window.print();
	}

	function handleExportPdf() {
		const monthName = data.monthNames[data.filters.month - 1];
		
		// Calculate average score
		const totalScore = data.lecturerScores.reduce((sum, s) => sum + s.avgOverall, 0);
		const avgScore = data.lecturerScores.length > 0 ? totalScore / data.lecturerScores.length : 0;

		const reportData: ReportData = {
			title: `Laporan Penilaian ${monthName} ${data.filters.year}`,
			dateRange: {
				from: `1 ${monthName} ${data.filters.year}`,
				to: `${new Date(data.filters.year, data.filters.month, 0).getDate()} ${monthName} ${data.filters.year}`
			},
			summaryStats: {
				totalEvaluations: data.evaluations.length,
				averageScore: avgScore,
				recommendationYes: data.recommendationStats.ya,
				recommendationNo: data.recommendationStats.tidak
			},
			lecturerScores: data.lecturerScores.map(s => ({
				...s,
				trend: 'stable' as const,
				riskLevel: analytics.riskAssessment.find(r => r.lecturerName === s.lecturerName)?.riskLevel || 'low'
			})),
			evaluations: data.evaluations.map(e => ({
				namaPenilai: e.nama_penilai,
				lecturerName: e.lecturer?.nama || '-',
				tarikh: e.tarikh_penilaian,
				minggu: e.session?.minggu || 1,
				jenisKuliah: e.session?.jenis_kuliah || 'Subuh',
				q1: e.q1_tajuk,
				q2: e.q2_ilmu,
				q3: e.q3_penyampaian,
				q4: e.q4_masa,
				cadanganTeruskan: e.cadangan_teruskan
			})),
			insights: analytics.insights
		};

		const filename = `laporan-penilaian-${monthName.toLowerCase()}-${data.filters.year}.pdf`;
		downloadPDFReport(reportData, filename);
		showExportMenu = false;
	}

	// Chart data
	const chartLabels = $derived(data.lecturerScores.map(s => s.lecturerName));
	const chartData = $derived(data.lecturerScores.map(s => s.avgOverall));
	const pieLabels = ['Ya', 'Tidak'];
	const pieData = $derived([data.recommendationStats.ya, data.recommendationStats.tidak]);

	// Dynamic import for charts (client-side only)
	let BarChart: any = $state(null);
	let PieChart: any = $state(null);

	$effect(() => {
		if (browser) {
			import('$lib/components/charts').then(module => {
				BarChart = module.BarChart;
				PieChart = module.PieChart;
			});
		}
	});
</script>

<svelte:head>
	<title>Laporan Penilaian - Panel Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>Laporan Penilaian</h1>
		<div class="header-actions">
			<div class="export-dropdown">
				<Button variant="secondary" onclick={() => showExportMenu = !showExportMenu}>
					📥 Export ▾
				</Button>
				{#if showExportMenu}
					<div class="export-menu">
						<button onclick={() => handleExportCsv('full')}>📊 CSV Penuh</button>
						<button onclick={() => handleExportCsv('lecturer')}>👤 CSV Penceramah</button>
						<button onclick={() => handleExportCsv('summary')}>📋 CSV Ringkasan</button>
						<hr />
						<button onclick={handleExportPdf}>📄 PDF Laporan</button>
					</div>
				{/if}
			</div>
			<Button variant="secondary" onclick={handlePrint}>🖨️ Cetak</Button>
		</div>
	</div>

	<!-- Filters -->
	<div class="filter-bar">
		<Select label="Bulan" options={monthOptions} bind:value={selectedMonth} />
		<Select label="Tahun" options={yearOptions} bind:value={selectedYear} />
		<Select label="Minggu" options={weekOptions} bind:value={selectedWeek} />
		<Select label="Penceramah" options={lecturerOptions} bind:value={selectedLecturer} />
		<Select label="Jenis Kuliah" options={typeOptions} bind:value={selectedType} />
		<div class="filter-action">
			<Button onclick={applyFilters}>Tapis</Button>
			{#if selectedLecturer && individualReport()}
				<Button variant="secondary" onclick={() => showIndividualReport = !showIndividualReport}>
					{showIndividualReport ? 'Tutup Laporan' : '📋 Laporan Individu'}
				</Button>
			{/if}
		</div>
	</div>

	<!-- Individual Lecturer Report -->
	{#if showIndividualReport && selectedLecturerInfo && individualReport()}
		{@const report = individualReport()}
		{@const lecturerSchedule = data.lecturerSessions?.filter(s => s.lecturer_id === selectedLecturer) || []}
		<div class="individual-report" id="individual-report">
			<div class="report-header">
				<div class="lecturer-profile">
					{#if selectedLecturerInfo.gambar_url}
						<img src={selectedLecturerInfo.gambar_url} alt={selectedLecturerInfo.nama} class="lecturer-photo" />
					{:else}
						<div class="lecturer-photo-placeholder">👤</div>
					{/if}
					<div class="lecturer-details">
						<h2>{selectedLecturerInfo.nama}</h2>
						<p class="report-period">Laporan Penilaian: {data.monthNames[data.filters.month - 1]} {data.filters.year}</p>
						<p class="response-count">{report.totalResponses} responden</p>
					</div>
				</div>
				<div class="grade-badge" style="background-color: {report.gradeColor}">
					<span class="grade-letter">{report.grade}</span>
					<span class="grade-percent">{report.percentage.toFixed(1)}%</span>
				</div>
			</div>

			<!-- Jadual Slot Ceramah -->
			{#if lecturerSchedule.length > 0}
			<div class="schedule-section">
				<h3>📅 Jadual Slot Ceramah</h3>
				<div class="schedule-tags">
					{#each lecturerSchedule as slot}
						<span class="schedule-tag" class:subuh={slot.jenis_kuliah === 'Subuh'} class:maghrib={slot.jenis_kuliah === 'Maghrib'} class:tazkirah={slot.jenis_kuliah === 'Tazkirah Jumaat'}>
							{slot.hari} - {slot.jenis_kuliah === 'Subuh' ? 'Kuliah Subuh' : slot.jenis_kuliah === 'Maghrib' ? 'Kuliah Maghrib' : 'Tazkirah Jumaat'}
						</span>
					{/each}
				</div>
			</div>
			{/if}

			<div class="scores-section">
				<h3>📊 Markah Penilaian</h3>
				<div class="score-grid">
					<div class="score-item">
						<div class="score-label">
							<strong>Q1:</strong> Adakah tajuk kuliah yang disampaikan sesuai dengan keperluan jemaah?
						</div>
						<div class="score-bar-container">
							<div class="score-bar" style="width: {(report.q1.total / report.q1.max) * 100}%; background-color: {report.gradeColor}"></div>
						</div>
						<div class="score-value">{report.q1.total}/{report.q1.max}</div>
					</div>
					<div class="score-item">
						<div class="score-label">
							<strong>Q2:</strong> Adakah penceramah menguasai ilmu yang disampaikan?
						</div>
						<div class="score-bar-container">
							<div class="score-bar" style="width: {(report.q2.total / report.q2.max) * 100}%; background-color: {report.gradeColor}"></div>
						</div>
						<div class="score-value">{report.q2.total}/{report.q2.max}</div>
					</div>
					<div class="score-item">
						<div class="score-label">
							<strong>Q3:</strong> Adakah cara penyampaian penceramah menarik dan mudah difahami?
						</div>
						<div class="score-bar-container">
							<div class="score-bar" style="width: {(report.q3.total / report.q3.max) * 100}%; background-color: {report.gradeColor}"></div>
						</div>
						<div class="score-value">{report.q3.total}/{report.q3.max}</div>
					</div>
					<div class="score-item">
						<div class="score-label">
							<strong>Q4:</strong> Adakah penceramah menepati masa yang ditetapkan?
						</div>
						<div class="score-bar-container">
							<div class="score-bar" style="width: {(report.q4.total / report.q4.max) * 100}%; background-color: {report.gradeColor}"></div>
						</div>
						<div class="score-value">{report.q4.total}/{report.q4.max}</div>
					</div>
				</div>
				<div class="total-score">
					<strong>Jumlah Keseluruhan:</strong> {report.grandTotal}/{report.maxTotal} ({report.percentage.toFixed(1)}%)
				</div>
			</div>

			<div class="recommendation-section">
				<h3>Cadangan Diteruskan</h3>
				<div class="recommendation-bars">
					<div class="rec-item">
						<span class="rec-label">✅ Ya</span>
						<div class="rec-bar-container">
							<div class="rec-bar rec-yes" style="width: {report.recommendation.yesPercent}%"></div>
						</div>
						<span class="rec-value">{report.recommendation.yes} ({report.recommendation.yesPercent.toFixed(0)}%)</span>
					</div>
					<div class="rec-item">
						<span class="rec-label">❌ Tidak</span>
						<div class="rec-bar-container">
							<div class="rec-bar rec-no" style="width: {report.recommendation.noPercent}%"></div>
						</div>
						<span class="rec-value">{report.recommendation.no} ({report.recommendation.noPercent.toFixed(0)}%)</span>
					</div>
				</div>
			</div>

			<div class="grade-legend">
				<h4>Skala Gred</h4>
				<div class="legend-items">
					<span class="legend-item" style="background: #1a5f2a">A: 76% - 100%</span>
					<span class="legend-item" style="background: #f0ad4e">B: 51% - 75%</span>
					<span class="legend-item" style="background: #fd7e14">C: 26% - 50%</span>
					<span class="legend-item" style="background: #dc3545">D: 0% - 25%</span>
				</div>
			</div>

			<div class="report-actions no-print">
				<Button onclick={printIndividualReport}>🖨️ Cetak Laporan</Button>
			</div>
		</div>
	{/if}

	<!-- Summary Stats -->
	<div class="stats-row">
		<div class="stat-card">
			<div class="stat-value">{data.evaluations.length}</div>
			<div class="stat-label">Jumlah Penilaian</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{analytics.summary.averageScore.toFixed(2)}</div>
			<div class="stat-label">Purata Skor</div>
		</div>
		<div class="stat-card highlight-green">
			<div class="stat-value">{data.recommendationStats.ya}</div>
			<div class="stat-label">Cadangan Ya ({analytics.summary.recommendationYesPercent.toFixed(0)}%)</div>
		</div>
		<div class="stat-card highlight-red">
			<div class="stat-value">{data.recommendationStats.tidak}</div>
			<div class="stat-label">Cadangan Tidak</div>
		</div>
	</div>

	<!-- Insights Section -->
	{#if analytics.insights.keyFindings.length > 0 || analytics.insights.recommendations.length > 0}
	<div class="insights-section">
		<div class="insights-card">
			<h3>📊 Penemuan Utama</h3>
			<ul>
				{#each analytics.insights.keyFindings as finding}
					<li>{finding}</li>
				{/each}
			</ul>
		</div>
		
		{#if analytics.insights.strengths.length > 0}
		<div class="insights-card strengths">
			<h3>✅ Kekuatan</h3>
			<ul>
				{#each analytics.insights.strengths as strength}
					<li>{strength}</li>
				{/each}
			</ul>
		</div>
		{/if}

		{#if analytics.insights.improvements.length > 0}
		<div class="insights-card improvements">
			<h3>⚠️ Perlu Perhatian</h3>
			<ul>
				{#each analytics.insights.improvements as improvement}
					<li>{improvement}</li>
				{/each}
			</ul>
		</div>
		{/if}

		{#if analytics.insights.recommendations.length > 0}
		<div class="insights-card recommendations">
			<h3>💡 Cadangan Tindakan</h3>
			<ol>
				{#each analytics.insights.recommendations as recommendation}
					<li>{recommendation}</li>
				{/each}
			</ol>
		</div>
		{/if}
	</div>
	{/if}

	<!-- Charts -->
	<div class="charts-grid">
		<div class="chart-card">
			<h3>Purata Skor Per Penceramah</h3>
			{#if BarChart && chartLabels.length > 0}
				<svelte:component this={BarChart} labels={chartLabels} data={chartData} title="Purata Skor" />
			{:else if chartLabels.length === 0}
				<p class="no-data">Tiada data untuk dipaparkan</p>
			{:else}
				<p class="loading">Memuatkan carta...</p>
			{/if}
		</div>

		<div class="chart-card">
			<h3>Cadangan Diteruskan</h3>
			{#if PieChart && (pieData[0] > 0 || pieData[1] > 0)}
				<svelte:component this={PieChart} labels={pieLabels} data={pieData} />
			{:else if pieData[0] === 0 && pieData[1] === 0}
				<p class="no-data">Tiada data untuk dipaparkan</p>
			{:else}
				<p class="loading">Memuatkan carta...</p>
			{/if}
		</div>
	</div>

	<!-- Lecturer Scores Table -->
	<div class="table-card">
		<h3>Skor Penceramah</h3>
		{#if data.lecturerScores.length > 0}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Penceramah</th>
							<th>Tajuk (Q1)</th>
							<th>Ilmu (Q2)</th>
							<th>Penyampaian (Q3)</th>
							<th>Masa (Q4)</th>
							<th>Purata</th>
							<th>Bil.</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.lecturerScores as score}
							{@const risk = analytics.riskAssessment.find(r => r.lecturerName === score.lecturerName)}
							<tr class={risk?.riskLevel === 'high' ? 'row-warning' : ''}>
								<td>
									{score.lecturerName}
									{#if analytics.insights.topPerformer?.name === score.lecturerName}
										<span class="badge badge-top">🏆</span>
									{/if}
								</td>
								<td class={score.avgQ1 < 2.5 ? 'low-score' : ''}>{score.avgQ1.toFixed(2)}</td>
								<td class={score.avgQ2 < 2.5 ? 'low-score' : ''}>{score.avgQ2.toFixed(2)}</td>
								<td class={score.avgQ3 < 2.5 ? 'low-score' : ''}>{score.avgQ3.toFixed(2)}</td>
								<td class={score.avgQ4 < 2.5 ? 'low-score' : ''}>{score.avgQ4.toFixed(2)}</td>
								<td class="highlight {score.avgOverall >= 3.5 ? 'high-score' : score.avgOverall < 2.5 ? 'low-score' : ''}">{score.avgOverall.toFixed(2)}</td>
								<td>{score.totalEvaluations}</td>
								<td class="status-cell">
									{#if risk?.riskLevel === 'high'}
										<span class="badge-status badge-danger">Perhatian</span>
									{:else if risk?.riskLevel === 'medium'}
										<span class="badge-status badge-warning">Sederhana</span>
									{:else}
										<span class="badge-status badge-success">Baik</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="no-data">Tiada data penceramah</p>
		{/if}
	</div>

	<!-- Evaluation Records Table -->
	<div class="table-card">
		<h3>Rekod Penilaian</h3>
		{#if data.evaluations.length > 0}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Tarikh</th>
							<th>Penilai</th>
							<th>Penceramah</th>
							<th>Q1</th>
							<th>Q2</th>
							<th>Q3</th>
							<th>Q4</th>
							<th>Cadangan</th>
							<th class="action-col">Tindakan</th>
						</tr>
					</thead>
					<tbody>
						{#each data.evaluations as evaluation}
							<tr>
								<td>{evaluation.tarikh_penilaian}</td>
								<td>{evaluation.nama_penilai}</td>
								<td>{evaluation.lecturer?.nama || '-'}</td>
								<td>{evaluation.q1_tajuk}</td>
								<td>{evaluation.q2_ilmu}</td>
								<td>{evaluation.q3_penyampaian}</td>
								<td>{evaluation.q4_masa}</td>
								<td class={evaluation.cadangan_teruskan ? 'yes' : 'no'}>
									{evaluation.cadangan_teruskan ? 'Ya' : 'Tidak'}
								</td>
								<td class="action-col">
									{#if deleteConfirmId === evaluation.id}
										<div class="delete-confirm">
											<form method="POST" action="?/deleteEvaluation" use:enhance={() => {
												return async ({ update }) => {
													deleteConfirmId = null;
													await update();
												};
											}}>
												<input type="hidden" name="id" value={evaluation.id} />
												<button type="submit" class="btn-confirm-delete">Pasti?</button>
											</form>
											<button class="btn-cancel" onclick={() => deleteConfirmId = null}>Batal</button>
										</div>
									{:else}
										<button class="btn-delete" onclick={() => deleteConfirmId = evaluation.id}>🗑️</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="no-data">Tiada rekod penilaian</p>
		{/if}
	</div>
</div>


<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		color: #333;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	@media print {
		.page-header .header-actions,
		.filter-bar,
		.sidebar,
		.mobile-header {
			display: none !important;
		}

		.page {
			max-width: 100%;
			padding: 0;
		}

		.chart-card,
		.table-card,
		.stat-card {
			box-shadow: none;
			border: 1px solid #ddd;
		}
	}

	.filter-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		background: white;
		padding: 1rem;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		flex-wrap: wrap;
		align-items: flex-end;
	}

	.filter-bar :global(.select-group) {
		margin-bottom: 0;
		min-width: 140px;
	}

	.filter-action {
		display: flex;
		align-items: flex-end;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		text-align: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1a5f2a;
	}

	.stat-label {
		color: #666;
		font-size: 0.85rem;
		margin-top: 0.25rem;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.chart-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-card h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.table-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.table-card h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
		color: #333;
	}

	td.highlight {
		font-weight: 600;
		color: #1a5f2a;
	}

	td.yes {
		color: #1a5f2a;
	}

	td.no {
		color: #dc3545;
	}

	.no-data, .loading {
		text-align: center;
		color: #999;
		padding: 2rem;
		font-style: italic;
	}

	/* Export Dropdown */
	.export-dropdown {
		position: relative;
	}

	.export-menu {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		min-width: 180px;
		z-index: 100;
		overflow: hidden;
	}

	.export-menu button {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.export-menu button:hover {
		background: #f5f5f5;
	}

	.export-menu hr {
		margin: 0;
		border: none;
		border-top: 1px solid #eee;
	}

	/* Insights Section */
	.insights-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.insights-card {
		background: white;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.insights-card h3 {
		font-size: 0.95rem;
		color: #333;
		margin-bottom: 0.75rem;
	}

	.insights-card ul, .insights-card ol {
		margin: 0;
		padding-left: 1.25rem;
	}

	.insights-card li {
		font-size: 0.85rem;
		color: #555;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.insights-card.strengths {
		border-left: 4px solid #1a5f2a;
	}

	.insights-card.improvements {
		border-left: 4px solid #f0ad4e;
	}

	.insights-card.recommendations {
		border-left: 4px solid #5bc0de;
	}

	.stat-card.highlight-green .stat-value {
		color: #1a5f2a;
	}

	.stat-card.highlight-red .stat-value {
		color: #dc3545;
	}

	/* Status badges */
	.status-cell {
		text-align: center;
	}

	.badge-status {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		text-align: center;
		min-width: 70px;
	}

	.badge-danger {
		background-color: #fee2e2;
		color: #b91c1c;
	}

	.badge-warning {
		background-color: #fef3c7;
		color: #92400e;
	}

	.badge-success {
		background-color: #d1fae5;
		color: #065f46;
	}

	.badge {
		font-size: 0.8rem;
		margin-left: 0.25rem;
	}

	.badge-top {
		color: #ffc107;
	}

	.row-warning {
		background: #fff8f8;
	}

	.low-score {
		color: #dc3545;
		font-weight: 600;
	}

	.high-score {
		color: #1a5f2a;
		font-weight: 700;
	}

	.action-col {
		width: 100px;
		text-align: center;
	}

	.btn-delete {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.25rem;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.btn-delete:hover {
		opacity: 1;
	}

	.delete-confirm {
		display: flex;
		gap: 0.25rem;
		justify-content: center;
	}

	.btn-confirm-delete {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.btn-confirm-delete:hover {
		background: #c82333;
	}

	.btn-cancel {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #5a6268;
	}

	/* Individual Report Styles */
	.individual-report {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border: 2px solid #1a5f2a;
	}

	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #eee;
	}

	.lecturer-profile {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.lecturer-photo {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #1a5f2a;
	}

	.lecturer-photo-placeholder {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		border: 3px solid #1a5f2a;
	}

	.lecturer-details h2 {
		font-size: 1.5rem;
		color: #333;
		margin: 0 0 0.5rem;
	}

	.report-period {
		color: #666;
		margin: 0 0 0.25rem;
	}

	.response-count {
		color: #999;
		font-size: 0.9rem;
		margin: 0;
	}

	.grade-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		color: white;
		text-align: center;
	}

	.grade-letter {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.grade-percent {
		font-size: 0.9rem;
		font-weight: 500;
	}

	/* Schedule Section */
	.schedule-section {
		margin-bottom: 2rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
	}

	.schedule-section h3 {
		font-size: 1rem;
		color: #333;
		margin-bottom: 0.75rem;
	}

	.schedule-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.schedule-tag {
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-size: 0.85rem;
		font-weight: 500;
		background: #e8f5e9;
		color: #1a5f2a;
	}

	.schedule-tag.subuh {
		background: #fff3e0;
		color: #e65100;
	}

	.schedule-tag.maghrib {
		background: #e8f5e9;
		color: #1a5f2a;
	}

	.schedule-tag.tazkirah {
		background: #e3f2fd;
		color: #1565c0;
	}

	.scores-section {
		margin-bottom: 2rem;
	}

	.scores-section h3 {
		font-size: 1.1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.score-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.score-item {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
		padding: 1rem;
		background: #fafafa;
		border-radius: 0.5rem;
		border-left: 4px solid #1a5f2a;
	}

	.score-item .score-label {
		font-size: 0.9rem;
		color: #555;
		line-height: 1.4;
	}

	.score-item .score-label strong {
		color: #1a5f2a;
	}

	.score-item .score-bar-container {
		margin-top: 0.25rem;
	}

	.score-item .score-value {
		font-size: 1rem;
		margin-top: 0.25rem;
	}

	.score-label {
		font-weight: 500;
		color: #555;
	}

	.score-bar-container {
		height: 24px;
		background: #f0f0f0;
		border-radius: 12px;
		overflow: hidden;
	}

	.score-bar {
		height: 100%;
		border-radius: 12px;
		transition: width 0.3s ease;
	}

	.score-value {
		font-weight: 600;
		color: #333;
		text-align: right;
	}

	.total-score {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
		font-size: 1.1rem;
		text-align: center;
	}

	.recommendation-section {
		margin-bottom: 2rem;
	}

	.recommendation-section h3 {
		font-size: 1.1rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.recommendation-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.rec-item {
		display: grid;
		grid-template-columns: 80px 1fr 120px;
		align-items: center;
		gap: 1rem;
	}

	.rec-label {
		font-weight: 500;
	}

	.rec-bar-container {
		height: 20px;
		background: #f0f0f0;
		border-radius: 10px;
		overflow: hidden;
	}

	.rec-bar {
		height: 100%;
		border-radius: 10px;
		transition: width 0.3s ease;
	}

	.rec-bar.rec-yes {
		background: #1a5f2a;
	}

	.rec-bar.rec-no {
		background: #dc3545;
	}

	.rec-value {
		font-weight: 500;
		text-align: right;
	}

	.grade-legend {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
	}

	.grade-legend h4 {
		font-size: 0.9rem;
		color: #666;
		margin: 0 0 0.75rem;
	}

	.legend-items {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.legend-item {
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		color: white;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.report-actions {
		text-align: center;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	@media print {
		.no-print {
			display: none !important;
		}

		.individual-report {
			border: none;
			box-shadow: none;
			padding: 0;
		}

		.page > *:not(.individual-report):not(.page-header h1) {
			display: none !important;
		}

		.page-header {
			margin-bottom: 1rem;
		}

		.page-header .header-actions {
			display: none !important;
		}
	}

	@media (max-width: 768px) {
		.filter-bar {
			flex-direction: column;
		}

		.filter-bar :global(.select-group) {
			width: 100%;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.report-header {
			flex-direction: column;
			gap: 1.5rem;
			align-items: center;
			text-align: center;
		}

		.lecturer-profile {
			flex-direction: column;
			text-align: center;
		}

		.score-item {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.score-bar-container {
			order: 2;
		}

		.score-value {
			order: 3;
			text-align: left;
		}

		.rec-item {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.rec-value {
			text-align: left;
		}
	}
</style>
