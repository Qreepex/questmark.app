<script lang="ts">
	import type { Snippet } from 'svelte';

	let { open = $bindable(false), children } = $props<{
		open?: boolean;
		children: Snippet;
	}>();
</script>

<button
	type="button"
	aria-label="Close panel"
	class="fixed inset-0 z-999 bg-black/50 sm:hidden {open ? 'block' : 'hidden'}"
	onclick={() => (open = false)}
></button>

{#if open}
	<div
		class="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] z-1000 flex max-h-[70vh] flex-col gap-3 px-4 sm:hidden"
	>
		{@render children()}
	</div>
{/if}
