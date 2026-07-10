<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';

	let { value, label, sublabel, color = '#c2673f' } = $props<{
		value: string | number;
		label: string;
		sublabel?: string;
		color?: string;
	}>();

	let displayValue = $state<string | number>(0);
	let hasAnimated = false;

	$effect(() => {
		if (typeof value !== 'number') {
			displayValue = value;
			return;
		}

		const target = value;
		const start = hasAnimated && typeof displayValue === 'number' ? displayValue : 0;
		hasAnimated = true;
		const duration = 600;
		const startTime = performance.now();
		let frame: number;

		function step(now: number): void {
			const progress = Math.min(1, (now - startTime) / duration);
			const eased = 1 - (1 - progress) * (1 - progress);
			displayValue = Math.round(start + (target - start) * eased);

			if (progress < 1) {
				frame = requestAnimationFrame(step);
			}
		}

		frame = requestAnimationFrame(step);

		return () => cancelAnimationFrame(frame);
	});
</script>

<Panel
	floating
	class="flex flex-col gap-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
>
	<div class="flex items-center gap-2">
		<span class="h-2 w-2 rounded-full" style="background: {color}"></span>
		<p class="text-xs font-medium tracking-wide text-(--muted)">{label}</p>
	</div>
	<p
		class="truncate text-3xl font-bold tracking-tight sm:text-4xl"
		style="color: {typeof value === 'number' ? color : 'var(--text)'}"
	>
		{displayValue}
	</p>
	{#if sublabel}
		<p class="text-xs text-(--muted-dim)">{sublabel}</p>
	{/if}
</Panel>
