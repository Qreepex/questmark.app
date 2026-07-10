<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import { CONTINENTS } from '$lib/dashboard/continents';
	import { getAllTags } from '$lib/dashboard/helpers';
	import { wrappedFilters } from '$lib/state/wrappedFilters.svelte';
	import type { PlaceRecord } from '$lib/types';

	let { places } = $props<{ places: PlaceRecord[] }>();

	const countryOptions = $derived(
		[...new Set(places.map((place: PlaceRecord) => place.countryCode).filter(Boolean))]
			.sort()
			.map((code) => ({ value: code as string, label: code as string, icon: code as string }))
	);

	const continentOptions = CONTINENTS.map((continent) => ({
		value: continent.code,
		label: continent.name
	}));

	const tagOptions = $derived(getAllTags(places).map((tag: string) => ({ value: tag, label: tag })));
</script>

<Panel floating class="flex flex-wrap items-end gap-3">
	<div class="min-w-40 flex-1">
		<MultiSelect label="Countries" bind:value={wrappedFilters.countryCodes} options={countryOptions} />
	</div>
	<div class="min-w-40 flex-1">
		<MultiSelect label="Continents" bind:value={wrappedFilters.continents} options={continentOptions} />
	</div>
	<div class="min-w-40 flex-1">
		<MultiSelect label="Tags" bind:value={wrappedFilters.tags} options={tagOptions} />
	</div>
	<Button
		variant="ghost"
		onclick={() => {
			wrappedFilters.countryCodes = [];
			wrappedFilters.continents = [];
			wrappedFilters.tags = [];
		}}
	>
		Reset filters
	</Button>
</Panel>
