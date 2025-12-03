<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, PieController, ArcElement, Title, Tooltip, Legend } from 'chart.js';

	Chart.register(PieController, ArcElement, Title, Tooltip, Legend);

	interface Props {
		labels: string[];
		data: number[];
		title?: string;
		backgroundColor?: string[];
	}

	let { 
		labels, 
		data, 
		title = '', 
		backgroundColor = ['#1a5f2a', '#dc3545'] 
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		chart = new Chart(canvas, {
			type: 'pie',
			data: {
				labels,
				datasets: [{
					data,
					backgroundColor
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom'
					},
					title: {
						display: !!title,
						text: title
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
		max-width: 400px;
		margin: 0 auto;
	}
</style>
