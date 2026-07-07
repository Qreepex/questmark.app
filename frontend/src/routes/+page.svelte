<script lang="ts">
	import {
		clearStoredToken,
		createPlace,
		deletePlace,
		fetchCurrentUser,
		fetchPlaces,
		getBackendUrl,
		getStoredToken,
		loginUrl,
		parseUrlList,
		searchLocations,
		updatePlace
	} from '$lib/api';
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import type { PlacePayload, PlaceRecord, PlaceSearchResult, UserProfile } from '$lib/types';
	import { onMount } from 'svelte';

	let token = $state<string | null>(null);
	let user = $state<UserProfile | null>(null);
	let places = $state<PlaceRecord[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<PlaceSearchResult[]>([]);
	let selectedLocation = $state<PlaceSearchResult | null>(null);
	let editorMode = $state<'create' | 'edit'>('create');
	let editingPlace = $state<PlaceRecord | null>(null);
	let name = $state('');
	let description = $state('');
	let imageUrls = $state('');
	let socialUrls = $state('');
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
		window.location.href = loginUrl();
	}

	function signOut() {
		clearStoredToken();
		token = null;
		user = null;
		places = [];
		selectedLocation = null;
		editingPlace = null;
		statusMessage = 'Signed out.';
	}

	function selectSearchResult(result: PlaceSearchResult) {
		selectedLocation = result;
		editorMode = 'create';
		editingPlace = null;
		name = result.name;
		description = '';
		imageUrls = '';
		socialUrls = '';
		searchQuery = result.displayName;
		searchResults = [];
		statusMessage = null;
	}

	function pickMapLocation(selection: { latitude: number; longitude: number }) {
		selectedLocation = {
			name: 'Selected point',
			displayName: 'Selected point',
			latitude: selection.latitude,
			longitude: selection.longitude
		};
		editorMode = 'create';
		editingPlace = null;
		if (!name.trim()) {
			name = 'New place';
		}
	}

	function startEdit(place: PlaceRecord) {
		editorMode = 'edit';
		editingPlace = place;
		selectedLocation = {
			name: place.name,
			displayName: place.name,
			latitude: place.latitude,
			longitude: place.longitude
		};
		name = place.name;
		description = place.description ?? '';
		imageUrls = (place.imageUrls ?? []).join('\n');
		socialUrls = (place.socialUrls ?? []).join('\n');
		statusMessage = null;
	}

	function resetEditor() {
		editorMode = 'create';
		editingPlace = null;
		selectedLocation = null;
		name = '';
		description = '';
		imageUrls = '';
		socialUrls = '';
	}

	function buildPayload(): PlacePayload | null {
		if (!selectedLocation) {
			return null;
		}

		const finalName = name.trim() || selectedLocation.name;

		if (!finalName) {
			return null;
		}

		return {
			name: finalName,
			latitude: selectedLocation.latitude,
			longitude: selectedLocation.longitude,
			description: description.trim() ? description.trim() : null,
			imageUrls: parseUrlList(imageUrls),
			socialUrls: parseUrlList(socialUrls)
		};
	}

	async function savePlace() {
		if (!token) {
			beginLogin();
			return;
		}

		const payload = buildPayload();

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

	function refreshDashboard() {
		void loadDashboard();
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
			class="max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--panel)] p-8 shadow-2xl shadow-slate-950/40 backdrop-blur md:p-12"
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
				<a
					class="rounded-full border border-white/15 px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
					href={getBackendUrl()}
				>
					Backend health
				</a>
			</div>
			<p class="mt-6 text-sm text-slate-400">
				OAuth users only store an ID and username. Place data stays private to your account.
			</p>
		</section>
	</main>
{:else}
	<main class="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 p-4 md:p-6">
		<header
			class="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-[var(--panel)] px-5 py-4 shadow-2xl shadow-slate-950/30 backdrop-blur"
		>
			<div>
				<p class="text-xs uppercase tracking-[0.45em] text-cyan-300">Want To Go</p>
				<h1 class="mt-1 text-2xl font-semibold text-white">Travel bucket list</h1>
			</div>
			<div class="flex items-center gap-3">
				<div
					class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
				>
					{user?.username ?? 'Signed in'}
				</div>
				<button
					onclick={refreshDashboard}
					class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
				>
					Refresh
				</button>
				<button
					onclick={signOut}
					class="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/15"
				>
					Sign out
				</button>
			</div>
		</header>

		{#if statusMessage}
			<div
				class="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
			>
				{statusMessage}
			</div>
		{/if}

		<div class="grid flex-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
			<aside class="space-y-6">
				<section
					class="rounded-[1.75rem] border border-white/10 bg-[var(--panel)] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur"
				>
					<label for="place-search" class="text-xs uppercase tracking-[0.35em] text-slate-400"
						>Search places</label
					>
					<input
						id="place-search"
						bind:value={searchQuery}
						type="search"
						placeholder="Find cities, landmarks, or neighborhoods"
						class="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
					/>
					<p class="mt-2 text-xs text-slate-500">Searches Nominatim directly in the browser.</p>
					<div class="mt-4 space-y-2">
						{#if isSearching}
							<p class="text-sm text-slate-400">Searching...</p>
						{/if}
						{#each searchResults as result}
							<button
								onclick={() => selectSearchResult(result)}
								class="w-full rounded-2xl border border-white/8 bg-white/5 p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
							>
								<div class="text-sm font-medium text-white">{result.name}</div>
								<div class="mt-1 text-xs text-slate-400">{result.displayName}</div>
							</button>
						{/each}
						{#if !isSearching && searchQuery.trim() && searchResults.length === 0}
							<p class="text-sm text-slate-500">No search results yet.</p>
						{/if}
					</div>
				</section>

				<section
					class="rounded-[1.75rem] border border-white/10 bg-[var(--panel)] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur"
				>
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-xs uppercase tracking-[0.35em] text-slate-400">
								{editorMode === 'edit' ? 'Edit place' : 'New place'}
							</p>
							<h2 class="mt-1 text-lg font-semibold text-white">
								{selectedLocation ? selectedLocation.name : 'Choose a location'}
							</h2>
						</div>
						{#if editingPlace}
							<button
								onclick={resetEditor}
								class="text-sm text-slate-400 transition hover:text-white">Clear</button
							>
						{/if}
					</div>

					<div class="mt-4 space-y-4">
						<label class="block">
							<span class="text-xs uppercase tracking-[0.3em] text-slate-400">Name</span>
							<input
								bind:value={name}
								class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
								placeholder="A place you want to visit"
							/>
						</label>
						<label class="block">
							<span class="text-xs uppercase tracking-[0.3em] text-slate-400">Description</span>
							<textarea
								bind:value={description}
								rows="4"
								class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
								placeholder="Why is this on your bucket list?"></textarea>
						</label>
						<label class="block">
							<span class="text-xs uppercase tracking-[0.3em] text-slate-400">Image URLs</span>
							<textarea
								bind:value={imageUrls}
								rows="3"
								class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
								placeholder="One URL per line"></textarea>
						</label>
						<label class="block">
							<span class="text-xs uppercase tracking-[0.3em] text-slate-400">Social URLs</span>
							<textarea
								bind:value={socialUrls}
								rows="3"
								class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
								placeholder="TikTok, Instagram, or a post link"></textarea>
						</label>
						<button
							onclick={savePlace}
							class="w-full rounded-2xl bg-amber-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-400/40"
							disabled={!selectedLocation || isLoading}
						>
							{isLoading ? 'Saving...' : editorMode === 'edit' ? 'Update place' : 'Save place'}
						</button>
					</div>
				</section>

				<section
					class="rounded-[1.75rem] border border-white/10 bg-[var(--panel)] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur"
				>
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-white">Saved places</h2>
						<span class="text-xs uppercase tracking-[0.3em] text-slate-500">{places.length}</span>
					</div>

					<div class="mt-4 space-y-3">
						{#each places as place}
							<article class="rounded-2xl border border-white/8 bg-white/5 p-4">
								<div class="flex items-start justify-between gap-3">
									<div>
										<h3 class="font-medium text-white">{place.name}</h3>
										<p class="mt-1 text-xs text-slate-400">
											{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
										</p>
									</div>
									<div class="flex gap-2">
										<button
											onclick={() => startEdit(place)}
											class="text-xs text-cyan-300 transition hover:text-cyan-200">Edit</button
										>
										<button
											onclick={() => removePlace(place)}
											class="text-xs text-rose-300 transition hover:text-rose-200">Delete</button
										>
									</div>
								</div>
								{#if place.description}
									<p class="mt-3 text-sm text-slate-300">{place.description}</p>
								{/if}
								{#if place.imageUrls?.length}
									<p class="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">
										{place.imageUrls.length} image links
									</p>
								{/if}
								{#if place.socialUrls?.length}
									<p class="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
										{place.socialUrls.length} social links
									</p>
								{/if}
							</article>
						{/each}
						{#if places.length === 0}
							<p class="text-sm text-slate-500">No saved places yet.</p>
						{/if}
					</div>
				</section>
			</aside>

			<section class="min-h-[70vh] space-y-4">
				<div
					class="rounded-[2rem] border border-white/10 bg-[var(--panel)] p-3 shadow-2xl shadow-slate-950/30 backdrop-blur"
				>
					<LeafletMap {places} selection={selectedLocation} onPick={pickMapLocation} />
				</div>
				<div
					class="rounded-[1.5rem] border border-white/10 bg-[var(--panel)] px-5 py-4 text-sm text-slate-300 shadow-xl shadow-slate-950/20 backdrop-blur"
				>
					Use the search box, click a map point, or edit an existing pin. The backend is running at {getBackendUrl()}.
				</div>
			</section>
		</div>
	</main>
{/if}
