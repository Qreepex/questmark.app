<script lang="ts">
	import { wrappedFilters } from '$lib/state/wrappedFilters.svelte';

	let { availableYears, totalPlacesVisited, totalCountries } = $props<{
		availableYears: number[];
		totalPlacesVisited: number;
		totalCountries: number;
	}>();

	const heading = $derived(
		wrappedFilters.year === 'all' ? 'Your Travels, All Time' : `Your ${wrappedFilters.year} Wrapped`
	);
</script>

<div class="flex flex-col gap-4">
	<div>
		<h1 class="text-3xl font-bold tracking-tight text-(--text) sm:text-5xl">{heading}</h1>
		<p class="mt-2 text-(--muted)">
			{#if totalPlacesVisited === 0}
				No visits logged for this selection yet.
			{:else}
				{totalPlacesVisited}
				{totalPlacesVisited === 1 ? 'place' : 'places'} across {totalCountries}
				{totalCountries === 1 ? 'country' : 'countries'}.
			{/if}
		</p>
	</div>

	{#if availableYears.length > 0}
		<div class="flex flex-wrap gap-1.5 rounded-full border border-(--border) bg-(--surface-floating) p-1.5 text-sm shadow-xl shadow-black/40 backdrop-blur-md w-fit">
			<button
				type="button"
				onclick={() => wrappedFilters.setYear('all')}
				class="rounded-full px-3.5 py-1.5 font-medium transition hover:scale-105 {wrappedFilters.year ===
				'all'
					? 'bg-(--accent) text-(--ink)'
					: 'text-(--muted) hover:text-(--text)'}"
			>
				All time
			</button>
			{#each availableYears as year (year)}
				<button
					type="button"
					onclick={() => wrappedFilters.setYear(year)}
					class="rounded-full px-3.5 py-1.5 font-medium transition hover:scale-105 {wrappedFilters.year ===
					year
						? 'bg-(--accent) text-(--ink)'
						: 'text-(--muted) hover:text-(--text)'}"
				>
					{year}
				</button>
			{/each}
		</div>
	{/if}
</div>
