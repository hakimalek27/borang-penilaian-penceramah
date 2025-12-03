<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

	interface Props {
		labels: string[];
		data: number[];
		title?: string;
		backgroundColor?: string;
	}

	let { labels, data, title = '', backgroundColor = '#1a5f2a' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					label: title,
					data,
					backgroundColor,
					borderRadius: 4
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: !!title
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
		});
	});

	onDestroy(() => {
		chart?.destroy();
	});

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
