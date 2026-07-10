<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import type { PlaceRecord } from '$lib/types';

	let { places, highlightCountryCodes } = $props<{
		places: PlaceRecord[];
		highlightCountryCodes: string[];
	}>();
</script>

<Panel floating tight class="overflow-hidden transition duration-300 hover:shadow-2xl">
	<div class="px-4 py-3">
		<h3 class="text-sm font-semibold tracking-wide text-(--text)">Places you visited</h3>
	</div>
	<div class="h-80 border-t border-(--border) sm:h-96">
		<LeafletMap {places} {highlightCountryCodes} />
	</div>
</Panel>
