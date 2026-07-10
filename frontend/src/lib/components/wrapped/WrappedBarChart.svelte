<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { hexToRgba } from '$lib/dashboard/chartColors';
	import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
	import { onDestroy, onMount } from 'svelte';

	let {
		title,
		data,
		maxBars = 8,
		color = '#3987e5'
	} = $props<{
		title: string;
		data: { label: string; value: number }[];
		maxBars?: number;
		color?: string;
	}>();

	const bars = $derived(data.slice(0, maxBars));

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart: ChartType | null = null;

	async function render(): Promise<void> {
		if (!canvas) {
			return;
		}

		const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } = await import(
			'chart.js'
		);
		Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

		const config: ChartConfiguration<'bar'> = {
			type: 'bar',
			data: {
				labels: bars.map((bar: { label: string }) => bar.label),
				datasets: [
					{
						data: bars.map((bar: { value: number }) => bar.value),
						backgroundColor: color,
						hoverBackgroundColor: hexToRgba(color, 0.75),
						borderRadius: 4,
						borderSkipped: false,
						maxBarThickness: 22,
						categoryPercentage: 0.7,
						barPercentage: 0.9
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 500, easing: 'easeOutQuart' },
				scales: {
					x: {
						beginAtZero: true,
						ticks: { color: '#a39a8d', precision: 0 },
						grid: { color: 'rgba(245, 241, 234, 0.08)' },
						border: { display: false }
					},
					y: {
						ticks: { color: '#f4efe6', font: { weight: 500 } },
						grid: { display: false },
						border: { display: false }
					}
				},
				plugins: {
					tooltip: {
						backgroundColor: '#1e1e1e',
						titleColor: '#f4efe6',
						bodyColor: '#f4efe6',
						borderColor: 'rgba(245, 241, 234, 0.09)',
						borderWidth: 1,
						padding: 10,
						cornerRadius: 8,
						displayColors: false
					}
				}
			}
		};

		if (chart) {
			chart.data = config.data;
			chart.update();
			return;
		}

		chart = new Chart(canvas, config);
	}

	onMount(() => {
		void render();
	});

	onDestroy(() => {
		chart?.destroy();
	});

	$effect(() => {
		bars;
		color;

		if (chart) {
			void render();
		}
	});
</script>

<Panel floating class="transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
	<h3 class="mb-3 text-sm font-semibold tracking-wide text-(--text)">{title}</h3>
	{#if bars.length === 0}
		<p class="text-sm text-(--muted-dim)">No data for this selection.</p>
	{:else}
		<div style="height: {Math.max(bars.length, 1) * 34 + 16}px">
			<canvas bind:this={canvas}></canvas>
		</div>
	{/if}
</Panel>
