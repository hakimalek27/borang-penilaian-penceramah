<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	Chart.register(...registerables);

	interface Props {
		labels: string[];
		data: (number | null)[];
		title?: string;
	}

	let { labels, data, title = 'Trend Penilaian' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: title,
						data: data,
						borderColor: '#1a5f2a',
						backgroundColor: 'rgba(26, 95, 42, 0.1)',
						borderWidth: 2,
						fill: true,
						tension: 0.3,
						pointBackgroundColor: '#1a5f2a',
						pointBorderColor: '#fff',
						pointBorderWidth: 2,
						pointRadius: 5,
						pointHoverRadius: 7,
						spanGaps: true // Connect points even with null values
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const value = context.parsed.y;
								if (value === null) return 'Tiada data';
								return `Purata: ${value.toFixed(2)}/4.00`;
							}
						}
					}
				},
				scales: {
					y: {
						min: 0,
						max: 4,
						ticks: {
							stepSize: 1,
							callback: (value) => `${value}`
						},
						title: {
							display: true,
							text: 'Purata Skor'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Bulan'
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		});

		return () => {
			chart?.destroy();
		};
	});

	// Update chart when data changes
	$effect(() => {
		if (chart) {
			chart.data.labels = labels;
			chart.data.datasets[0].data = data;
			chart.update();
		}
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		height: 300px;
		width: 100%;
	}
</style>
