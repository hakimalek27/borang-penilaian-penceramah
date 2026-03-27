<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		type LecturerComparison,
		getComparisonLabels,
		getComparisonValues,
		getComparisonColors
	} from '$lib/utils/comparison';
	import type { Chart, ChartConfiguration } from 'chart.js';

	interface Props {
		comparisons: LecturerComparison[];
		title?: string;
	}

	let { comparisons, title = 'Perbandingan Skor Mengikut Soalan' }: Props = $props();

	let barCanvas: HTMLCanvasElement;
	let radarCanvas: HTMLCanvasElement;
	let barChart: Chart | null = null;
	let radarChart: Chart | null = null;

	const labels = getComparisonLabels();

	// Get score color class
	function getScoreClass(score: number): string {
		if (score >= 3.5) return 'excellent';
		if (score >= 3.0) return 'good';
		if (score >= 2.5) return 'average';
		return 'poor';
	}

	// Get rank
	function getRank(comparison: LecturerComparison): number {
		const sorted = [...comparisons].sort((a, b) => b.avgOverall - a.avgOverall);
		return sorted.findIndex(c => c.lecturerId === comparison.lecturerId) + 1;
	}

	function createCharts() {
		if (!browser || !barCanvas || !radarCanvas) return;

		import('chart.js').then(({ Chart, registerables }) => {
			Chart.register(...registerables);

			// Destroy existing charts
			if (barChart) barChart.destroy();
			if (radarChart) radarChart.destroy();

			const colors = getComparisonColors(comparisons.length);

			// Bar Chart - Score by Question
			const barDatasets = comparisons.map((comparison, index) => ({
				label: comparison.lecturerName,
				data: getComparisonValues(comparison),
				backgroundColor: colors[index],
				borderColor: colors[index].replace('0.8', '1'),
				borderWidth: 1
			}));

			const barConfig: ChartConfiguration = {
				type: 'bar',
				data: {
					labels,
					datasets: barDatasets
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'top'
						},
						title: {
							display: true,
							text: title,
							font: { size: 14 }
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							max: 4,
							ticks: {
								stepSize: 1
							}
						}
					}
				}
			};

			barChart = new Chart(barCanvas, barConfig);

			// Radar Chart - Overall Comparison
			const radarDatasets = comparisons.map((comparison, index) => ({
				label: comparison.lecturerName,
				data: getComparisonValues(comparison),
				backgroundColor: colors[index].replace('0.8', '0.2'),
				borderColor: colors[index].replace('0.8', '1'),
				borderWidth: 2,
				pointBackgroundColor: colors[index].replace('0.8', '1')
			}));

			const radarConfig: ChartConfiguration = {
				type: 'radar',
				data: {
					labels,
					datasets: radarDatasets
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'top'
						},
						title: {
							display: true,
							text: 'Profil Prestasi',
							font: { size: 14 }
						}
					},
					scales: {
						r: {
							beginAtZero: true,
							max: 4,
							ticks: {
								stepSize: 1
							}
						}
					}
				}
			};

			radarChart = new Chart(radarCanvas, radarConfig);
		});
	}

	onMount(() => {
		createCharts();
		return () => {
			if (barChart) barChart.destroy();
			if (radarChart) radarChart.destroy();
		};
	});

	$effect(() => {
		if (comparisons && browser) {
			createCharts();
		}
	});
</script>

<div class="comparison-container">
	<!-- Summary Cards -->
	<div class="summary-section">
		<h2>Ringkasan Perbandingan</h2>
		<div class="summary-cards">
			{#each comparisons as comparison}
				<div class="summary-card">
					<div class="card-header">
						<span class="rank">#{getRank(comparison)}</span>
						<span class="lecturer-name">{comparison.lecturerName}</span>
					</div>
					<div class="card-body">
						<div class="overall-score {getScoreClass(comparison.avgOverall)}">
							{comparison.avgOverall.toFixed(2)}
						</div>
						<span class="score-label">Purata Keseluruhan</span>
					</div>
					<div class="card-footer">
						<span class="eval-count">{comparison.totalEvaluations} penilaian</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Charts Section -->
	<div class="charts-section">
		<div class="chart-card">
			<div class="chart-wrapper">
				<canvas bind:this={barCanvas}></canvas>
			</div>
		</div>
		<div class="chart-card">
			<div class="chart-wrapper radar">
				<canvas bind:this={radarCanvas}></canvas>
			</div>
		</div>
	</div>

	<!-- Detail Table -->
	<div class="table-section">
		<h2>Perincian Skor</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Penceramah</th>
						<th class="center">Tajuk</th>
						<th class="center">Ilmu</th>
						<th class="center">Penyampaian</th>
						<th class="center">Masa</th>
						<th class="center">Purata</th>
						<th class="center">Penilaian</th>
					</tr>
				</thead>
				<tbody>
					{#each comparisons as comparison, i}
						<tr class:highlight={getRank(comparison) === 1}>
							<td class="rank-cell">{getRank(comparison)}</td>
							<td class="name-cell">{comparison.lecturerName}</td>
							<td class="score-cell {getScoreClass(comparison.avgQ1)}">{comparison.avgQ1.toFixed(2)}</td>
							<td class="score-cell {getScoreClass(comparison.avgQ2)}">{comparison.avgQ2.toFixed(2)}</td>
							<td class="score-cell {getScoreClass(comparison.avgQ3)}">{comparison.avgQ3.toFixed(2)}</td>
							<td class="score-cell {getScoreClass(comparison.avgQ4)}">{comparison.avgQ4.toFixed(2)}</td>
							<td class="score-cell overall {getScoreClass(comparison.avgOverall)}">
								<strong>{comparison.avgOverall.toFixed(2)}</strong>
							</td>
							<td class="count-cell">{comparison.totalEvaluations}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Legend -->
	<div class="legend-section">
		<h3>Petunjuk Skor</h3>
		<div class="legend-items">
			<div class="legend-item">
				<span class="legend-color excellent"></span>
				<span>Cemerlang (3.5 - 4.0)</span>
			</div>
			<div class="legend-item">
				<span class="legend-color good"></span>
				<span>Baik (3.0 - 3.4)</span>
			</div>
			<div class="legend-item">
				<span class="legend-color average"></span>
				<span>Sederhana (2.5 - 2.9)</span>
			</div>
			<div class="legend-item">
				<span class="legend-color poor"></span>
				<span>Perlu Penambahbaikan (&lt; 2.5)</span>
			</div>
		</div>
	</div>
</div>

<style>
	.comparison-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	/* Summary Section */
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.summary-card {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.rank {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #3b82f6;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lecturer-name {
		font-weight: 500;
		color: #374151;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-body {
		text-align: center;
		margin-bottom: 0.75rem;
	}

	.overall-score {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
	}

	.overall-score.excellent { color: #059669; }
	.overall-score.good { color: #3b82f6; }
	.overall-score.average { color: #f59e0b; }
	.overall-score.poor { color: #dc2626; }

	.score-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.card-footer {
		text-align: center;
	}

	.eval-count {
		font-size: 0.75rem;
		color: #6b7280;
		background: #e5e7eb;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	/* Charts Section */
	.charts-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.chart-card {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
	}

	.chart-wrapper {
		height: 300px;
		position: relative;
	}

	.chart-wrapper.radar {
		height: 300px;
	}

	/* Table Section */
	.table-wrapper {
		overflow-x: auto;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	th.center,
	td.center {
		text-align: center;
	}

	.rank-cell {
		font-weight: 600;
		color: #3b82f6;
		text-align: center;
		width: 40px;
	}

	.name-cell {
		font-weight: 500;
	}

	.score-cell {
		text-align: center;
		font-weight: 500;
	}

	.score-cell.excellent { color: #059669; background: #ecfdf5; }
	.score-cell.good { color: #3b82f6; background: #eff6ff; }
	.score-cell.average { color: #d97706; background: #fffbeb; }
	.score-cell.poor { color: #dc2626; background: #fef2f2; }

	.score-cell.overall {
		font-weight: 700;
	}

	.count-cell {
		text-align: center;
		color: #6b7280;
	}

	tr.highlight {
		background: #fefce8;
	}

	tr.highlight .rank-cell {
		color: #ca8a04;
	}

	/* Legend Section */
	.legend-section {
		background: #f9fafb;
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
	}

	.legend-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.legend-items {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.legend-color {
		width: 16px;
		height: 16px;
		border-radius: 0.25rem;
	}

	.legend-color.excellent { background: #059669; }
	.legend-color.good { background: #3b82f6; }
	.legend-color.average { background: #f59e0b; }
	.legend-color.poor { background: #dc2626; }

	@media (max-width: 768px) {
		.charts-section {
			grid-template-columns: 1fr;
		}

		.summary-cards {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		th,
		td {
			padding: 0.5rem;
			font-size: 0.75rem;
		}

		.overall-score {
			font-size: 1.5rem;
		}
	}
</style>
