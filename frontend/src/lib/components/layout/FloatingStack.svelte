<script lang="ts">
	import type { Snippet } from 'svelte';

	let { side = 'left', children } = $props<{
		side?: 'left' | 'right';
		children: Snippet;
	}>();

	const sideClass = $derived(side === 'left' ? 'sm:left-6' : 'sm:right-6');
</script>

<div
	class="pointer-events-none fixed z-1000 hidden w-[min(25rem,calc(100vw-2rem))] flex-col gap-3 sm:top-6 sm:bottom-6 sm:flex {sideClass}"
>
	{@render children()}
</div>
