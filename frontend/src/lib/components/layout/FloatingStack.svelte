<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		side = 'left',
		open = $bindable(true),
		children
	} = $props<{
		side?: 'left' | 'right';
		/** Mobile only: whether the stack is expanded as a bottom sheet. Always shown on sm+ screens. */
		open?: boolean;
		children: Snippet;
	}>();

	const sideClass = $derived(side === 'left' ? 'sm:left-6' : 'sm:right-6');
</script>

<button
	type="button"
	aria-label="Close panel"
	class="fixed inset-0 z-999 bg-black/50 sm:hidden {open ? 'block' : 'hidden'}"
	onclick={() => (open = false)}
></button>

<div
	class="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] z-1000 max-h-[70vh] flex-col gap-3 px-4 sm:inset-x-auto sm:top-6 sm:bottom-6 sm:flex sm:max-h-none sm:w-[min(25rem,calc(100vw-2rem))] sm:px-0 {sideClass} {open
		? 'flex'
		: 'hidden'}"
>
	{@render children()}
</div>
