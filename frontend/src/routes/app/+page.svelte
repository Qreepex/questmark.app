<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		clearStoredToken,
		createPlace,
		deletePlace,
		fetchCurrentUser,
		fetchPlaces,
		getStoredToken,
		reverseGeocodeLocation,
		searchLocations,
		updatePlace
	} from '$lib/api';
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import MapSearchPanel from '$lib/components/MapSearchPanel.svelte';
	import PlaceEditorPanel from '$lib/components/PlaceEditorPanel.svelte';
	import PlacesSidebar from '$lib/components/PlacesSidebar.svelte';
	import StatusToast from '$lib/components/StatusToast.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import {
		buildPlacePayload,
		createEmptyPlaceDraft,
		createPinnedSelection,
		createPlaceDraft,
		type MapSelection,
		type PlaceDraft
	} from '$lib/dashboard';
	import type { PlaceRecord, PlaceSearchResult, UserProfile } from '$lib/types';
	import { onMount } from 'svelte';

	let token = $state<string | null>(null);
	let user = $state<UserProfile | null>(null);
	let places = $state<PlaceRecord[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<PlaceSearchResult[]>([]);
	let selectedLocation = $state<MapSelection | null>(null);
	let editorMode = $state<'create' | 'edit'>('create');
	let editingPlace = $state<PlaceRecord | null>(null);
	let editorName = $state('');
	let editorDescription = $state('');
	let editorImageUrls = $state('');
	let editorSocialUrls = $state('');
	let isLoading = $state(false);
	let isSearching = $state(false);
	let statusMessage = $state<string | null>(null);
	let searchRun = 0;

	onMount(async () => {
		token = getStoredToken();

		if (!token) {
			return;
		}

		await loadDashboard();
	});

	$effect(() => {
		const query = searchQuery.trim();

		if (!query) {
			searchResults = [];
			isSearching = false;
			return;
		}

		const currentRun = ++searchRun;
		const handle = setTimeout(async () => {
			isSearching = true;
			try {
				const results = await searchLocations(query);
				if (currentRun === searchRun) {
					searchResults = results;
				}
			} catch (error) {
				if (currentRun === searchRun) {
					statusMessage = error instanceof Error ? error.message : 'Search failed';
				}
			} finally {
				if (currentRun === searchRun) {
					isSearching = false;
				}
			}
		}, 350);

		return () => clearTimeout(handle);
	});

	async function loadDashboard() {
		if (!token) {
			return;
		}

		isLoading = true;
		statusMessage = null;

		try {
			user = await fetchCurrentUser(token);
			places = await fetchPlaces(token);
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Unable to load dashboard';
			clearStoredToken();
			token = null;
		} finally {
			isLoading = false;
		}
	}

	function beginLogin() {
		goto('/auth/login');
	}

	function signOut() {
		clearStoredToken();
		token = null;
		user = null;
		places = [];
		selectedLocation = null;
		editingPlace = null;
		editorMode = 'create';
		setEditorDraft(createEmptyPlaceDraft());
		searchQuery = '';
		searchResults = [];
		statusMessage = 'Signed out.';
	}

	function setEditorDraft(draft: PlaceDraft) {
		editorName = draft.name;
		editorDescription = draft.description;
		editorImageUrls = draft.imageUrls;
		editorSocialUrls = draft.socialUrls;
	}

	function openEditor(
		location: MapSelection,
		mode: 'create' | 'edit',
		draft: PlaceDraft,
		place: PlaceRecord | null = null
	) {
		selectedLocation = location;
		editorMode = mode;
		editingPlace = place;
		setEditorDraft(draft);
	}

	function selectSearchResult(result: PlaceSearchResult) {
		openEditor(result, 'create', createPlaceDraft(result));
		searchQuery = result.displayName;
		searchResults = [];
		statusMessage = null;
	}

	async function pickMapLocation(selection: { latitude: number; longitude: number }) {
		statusMessage = null;

		let defaultName = 'New place';

		try {
			const location = await reverseGeocodeLocation(selection.latitude, selection.longitude);
			defaultName = location.name;
		} catch {
			defaultName = 'New place';
		}

		openEditor(
			createPinnedSelection(selection.latitude, selection.longitude, defaultName),
			'create',
			{
				...createEmptyPlaceDraft(),
				name: defaultName
			}
		);
	}

	function startEdit(place: PlaceRecord) {
		openEditor(
			{
				name: place.name,
				displayName: place.name,
				latitude: place.latitude,
				longitude: place.longitude
			},
			'edit',
			createPlaceDraft(place),
			place
		);
		statusMessage = null;
	}

	function resetEditor() {
		editorMode = 'create';
		selectedLocation = null;
		editingPlace = null;
		setEditorDraft(createEmptyPlaceDraft());
	}

	function closeEditor() {
		resetEditor();
	}

	async function savePlace() {
		if (!token) {
			beginLogin();
			return;
		}

		const payload = buildPlacePayload(selectedLocation, {
			name: editorName,
			description: editorDescription,
			imageUrls: editorImageUrls,
			socialUrls: editorSocialUrls
		});

		if (!payload) {
			statusMessage = 'Choose a place on the map or from search first.';
			return;
		}

		isLoading = true;
		statusMessage = null;

		try {
			if (editorMode === 'edit' && editingPlace) {
				await updatePlace(token, editingPlace.id, payload);
			} else {
				await createPlace(token, payload);
			}

			places = await fetchPlaces(token);
			resetEditor();
			statusMessage = 'Saved to your list.';
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Unable to save place';
		} finally {
			isLoading = false;
		}
	}

	async function removePlace(place: PlaceRecord) {
		if (!token) {
			return;
		}

		isLoading = true;
		statusMessage = null;

		try {
			await deletePlace(token, place.id);
			places = await fetchPlaces(token);
			if (
				selectedLocation?.name === place.name &&
				selectedLocation.latitude === place.latitude &&
				selectedLocation.longitude === place.longitude
			) {
				resetEditor();
			}
			if (editingPlace?.id === place.id) {
				resetEditor();
			}
			statusMessage = 'Removed place.';
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Unable to remove place';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Want To Go</title>
	<meta
		name="description"
		content="A map-based travel bucket list with OAuth login, saved places, and geocoded search."
	/>
</svelte:head>

{#if !token}
	<main class="flex min-h-screen items-center justify-center px-6 py-10">
		<section
			class="max-w-3xl rounded-4xl border border-white/10 bg-(--panel) p-8 shadow-2xl shadow-slate-950/40 backdrop-blur md:p-12"
		>
			<div
				class="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200"
			>
				<span class="h-2 w-2 rounded-full bg-amber-400"></span>
				Want To Go
			</div>
			<h1 class="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
				Save your next trip on a map, not in a notes app.
			</h1>
			<p class="mt-4 max-w-xl text-base text-slate-300 md:text-lg">
				Search places, pin them to the map, and keep private travel ideas tied to your Authentik
				account.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<button
					onclick={beginLogin}
					class="rounded-full bg-amber-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-300"
				>
					Sign in with Authentik
				</button>
			</div>
			<p class="mt-6 text-sm text-slate-400">
				OAuth users only store an ID and username. Place data stays private to your account.
			</p>
		</section>
	</main>
{:else}
	<main class="relative isolate h-screen overflow-hidden bg-slate-950">
		<div class="absolute inset-0 z-0">
			<LeafletMap {places} selection={selectedLocation} onPick={pickMapLocation} />
		</div>

		<StatusToast message={statusMessage} />

		<div
			class="pointer-events-none fixed left-4 top-4 flex w-[min(25rem,calc(100vw-2rem))] flex-col gap-3 sm:left-6 sm:top-6"
			style="z-index: 1000;"
		>
			<MapSearchPanel
				bind:query={searchQuery}
				results={searchResults}
				searching={isSearching}
				onSelectResult={selectSearchResult}
			/>
			<PlacesSidebar {places} onEdit={startEdit} onDelete={removePlace} />
		</div>

		<UserMenu username={user?.username ?? null} onSignOut={signOut} />

		<PlaceEditorPanel
			selection={selectedLocation}
			mode={editorMode}
			bind:name={editorName}
			bind:description={editorDescription}
			bind:imageUrls={editorImageUrls}
			bind:socialUrls={editorSocialUrls}
			isSaving={isLoading}
			onClose={closeEditor}
			onSave={savePlace}
		/>
	</main>
{/if}
