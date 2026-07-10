<script lang="ts">
	import { hexToRgba } from '$lib/dashboard/chartColors';
	import { onMount } from 'svelte';

	let {
		label,
		current,
		total,
		color = '#c2673f',
		size = 96
	} = $props<{
		label: string;
		current: number;
		total: number;
		color?: string;
		size?: number;
	}>();

	const pct = $derived(total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0);
	const strokeWidth = $derived(Math.max(6, Math.round(size * 0.09)));
	const radius = $derived(size / 2 - strokeWidth);
	const circumference = $derived(2 * Math.PI * radius);
	const targetOffset = $derived(circumference * (1 - pct / 100));

	let mounted = $state(false);
	const renderedOffset = $derived(mounted ? targetOffset : circumference);

	onMount(() => {
		requestAnimationFrame(() => (mounted = true));
	});
</script>

<div class="group flex flex-col items-center gap-2">
	<div
		class="relative transition duration-300 group-hover:scale-110"
		style="width: {size}px; height: {size}px"
	>
		<svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90">
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke={hexToRgba(color, 0.18)}
				stroke-width={strokeWidth}
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke={color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={renderedOffset}
				style="transition: stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)"
			/>
		</svg>
		<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
			<span class="font-bold text-(--text)" style="font-size: {size * 0.22}px">{pct}%</span>
		</div>
	</div>
	<div class="text-center">
		<p class="text-sm font-medium text-(--text)">{label}</p>
		<p class="text-xs text-(--muted-dim)">{current} / {total}</p>
	</div>
</div>
