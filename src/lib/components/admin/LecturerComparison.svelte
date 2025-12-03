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

	let { comparisons, title = 'Perbandingan Penceramah' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const labels = getComparisonLabels();

	function createChart() {
		if (!browser || !canvas) return;

		import('chart.js').then(({ Chart, registerables }) => {
			Chart.register(...registerables);

			if (chart) {
				chart.destroy();
			}

			const colors = getComparisonColors(comparisons.length);

			const datasets = comparisons.map((comparison, index) => ({
				label: comparison.lecturerName,
				data: getComparisonValues(comparison),
				backgroundColor: colors[index],
				borderColor: colors[index].replace('0.8', '1'),
				borderWidth: 1
			}));

			const config: ChartConfiguration = {
				type: 'bar',
				data: {
					labels,
					datasets
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
							text: title
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

			chart = new Chart(canvas, config);
		});
	}

	onMount(() => {
		createChart();
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});

	$effect(() => {
		if (comparisons && browser) {
			createChart();
		}
	});
</script>

<div class="comparison-container">
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>

	{#if comparisons.length > 0}
		<div class="comparison-table">
			<table>
				<thead>
					<tr>
						<th>Penceramah</th>
						<th>Purata</th>
						<th>Ya (%)</th>
						<th>Tidak (%)</th>
						<th>Jumlah</th>
					</tr>
				</thead>
				<tbody>
					{#each comparisons as comparison}
						<tr>
							<td>{comparison.lecturerName}</td>
							<td class="score">{comparison.avgOverall.toFixed(2)}</td>
							<td class="yes">{comparison.recommendationYesPercent.toFixed(1)}%</td>
							<td class="no">{comparison.recommendationNoPercent.toFixed(1)}%</td>
							<td>{comparison.totalEvaluations}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="no-data">Sila pilih penceramah untuk perbandingan</p>
	{/if}
</div>

<style>
	.comparison-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.chart-wrapper {
		height: 300px;
		position: relative;
	}

	.comparison-table {
		overflow-x: auto;
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

	.score {
		font-weight: 600;
		color: #1f2937;
	}

	.yes {
		color: #059669;
	}

	.no {
		color: #dc2626;
	}

	.no-data {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
	}

	@media (max-width: 640px) {
		th,
		td {
			padding: 0.5rem;
			font-size: 0.75rem;
		}
	}
</style>
