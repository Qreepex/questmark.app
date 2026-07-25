<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import ListManagerModal from '$lib/components/ListManagerModal.svelte';
	import Login from '$lib/components/Login.svelte';
	import FloatingStack from '$lib/components/layout/FloatingStack.svelte';
	import MobileNav from '$lib/components/layout/MobileNav.svelte';
	import MobileSheet from '$lib/components/layout/MobileSheet.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import MapSearchPanel from '$lib/components/MapSearchPanel.svelte';
	import PlaceEditorPanel from '$lib/components/PlaceEditorPanel.svelte';
	import PlaceViewerPanel from '$lib/components/PlaceViewerPanel.svelte';
	import PlacesSidebar from '$lib/components/PlacesSidebar.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import StatusToast from '$lib/components/StatusToast.svelte';
	import TravelTimeline from '$lib/components/TravelTimeline.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import ViewModeToggle from '$lib/components/ViewModeToggle.svelte';
	import { initDashboard, pickMapLocation, viewPlace } from '$lib/dashboard/actions';
	import { filterPlaces } from '$lib/dashboard/helpers';
	import { placeEditor } from '$lib/state/placeEditor.svelte';
	import { placeFilters } from '$lib/state/placeFilters.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import { placeViewer } from '$lib/state/placeViewer.svelte';
	import { session } from '$lib/state/session.svelte';
	import { visitsStore } from '$lib/state/visits.svelte';
	import { onMount } from 'svelte';

	const MOBILE_QUERY = '(max-width: 639.98px)';

	let showTimeline = $state(false);
	let placesSheetOpen = $state(false);
	let searchSheetOpen = $state(false);
	let isMobile = $state(
		typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
	);

	const visitedCountryCodes = $derived([
		...new Set(visitsStore.items.map((visit) => visit.place.countryCode).filter(Boolean))
	] as string[]);

	onMount(() => {
		void initDashboard();

		const mediaQuery = window.matchMedia(MOBILE_QUERY);
		const updateIsMobile = () => (isMobile = mediaQuery.matches);
		mediaQuery.addEventListener('change', updateIsMobile);
		return () => mediaQuery.removeEventListener('change', updateIsMobile);
	});

	$effect(() => {
		if (placeViewer.place || placeEditor.selection) {
			placesSheetOpen = false;
			searchSheetOpen = false;
		}
	});
</script>

{#snippet placesPanel()}
	{#if placeFilters.visited === 'been'}
		<div
			class="pointer-events-auto flex gap-1.5 rounded-full border border-(--border) bg-(--surface-floating) p-1 text-sm shadow-xl shadow-black/40 backdrop-blur-md"
		>
			<button
				type="button"
				onclick={() => (showTimeline = false)}
				class="flex-1 rounded-full px-3 py-1.5 font-medium transition {!showTimeline
					? 'bg-(--accent) text-(--ink)'
					: 'text-(--muted) hover:text-(--text)'}"
			>
				Places
			</button>
			<button
				type="button"
				onclick={() => (showTimeline = true)}
				class="flex-1 rounded-full px-3 py-1.5 font-medium transition {showTimeline
					? 'bg-(--accent) text-(--ink)'
					: 'text-(--muted) hover:text-(--text)'}"
			>
				Timeline
			</button>
		</div>
	{/if}
	{#if placeFilters.visited === 'been' && showTimeline}
		<TravelTimeline />
	{:else}
		<PlacesSidebar />
	{/if}
{/snippet}

<Seo title="Your map" description="Sign in to see your saved places, pinned on the map." noindex />

{#if !session.token}
	<Login />
{:else}
	<PageShell>
		{#snippet background()}
			<LeafletMap
				places={filterPlaces(placesStore.items, placeFilters)}
				selection={placeEditor.selection}
				focusPlace={placeViewer.place}
				onPick={pickMapLocation}
				onSelectPlace={viewPlace}
				highlightCountryCodes={placeFilters.visited === 'been' ? visitedCountryCodes : []}
			/>
		{/snippet}

		<StatusToast />

		{#if isMobile}
			<MobileSheet bind:open={searchSheetOpen}>
				<MapSearchPanel />
			</MobileSheet>
			<MobileSheet bind:open={placesSheetOpen}>
				{@render placesPanel()}
			</MobileSheet>
			<MobileNav bind:placesOpen={placesSheetOpen} bind:searchOpen={searchSheetOpen} />
		{:else}
			<FloatingStack side="left">
				<MapSearchPanel />
				{@render placesPanel()}
			</FloatingStack>

			<div class="pointer-events-auto fixed right-6 top-6 z-1000 flex items-center gap-2">
				<ViewModeToggle />
				<UserMenu />
			</div>
		{/if}

		<PlaceEditorPanel />
		<PlaceViewerPanel />
		<ListManagerModal />
	</PageShell>
{/if}
