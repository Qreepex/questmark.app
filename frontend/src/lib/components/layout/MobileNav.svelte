<script lang="ts">
	import UserMenu from '$lib/components/UserMenu.svelte';
	import { placeFilters } from '$lib/state/placeFilters.svelte';

	let { sheetOpen = $bindable(false) } = $props<{
		/** Whether the mobile bottom sheet (search + places list) is expanded. */
		sheetOpen?: boolean;
	}>();

	let searchActive = $state(false);

	function selectTab(tab: 'want-to-go' | 'been'): void {
		searchActive = false;

		if (placeFilters.visited === tab && sheetOpen) {
			sheetOpen = false;
			return;
		}
		placeFilters.visited = tab;
		sheetOpen = true;
	}

	function toggleSearch(): void {
		if (sheetOpen && searchActive) {
			sheetOpen = false;
			searchActive = false;
			return;
		}
		searchActive = true;
		sheetOpen = true;
	}
</script>

<nav
	class="pointer-events-auto fixed inset-x-0 bottom-0 z-1000 flex h-16 items-stretch justify-around border-t border-(--border) bg-(--surface-floating) pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
>
	<button
		type="button"
		onclick={() => selectTab('want-to-go')}
		class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition {placeFilters.visited ===
			'want-to-go'
			? 'text-(--accent-strong)'
			: 'text-(--muted)'}"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
		Want to go
	</button>
	<button
		type="button"
		onclick={() => selectTab('been')}
		class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition {placeFilters.visited ===
			'been'
			? 'text-(--accent-strong)'
			: 'text-(--muted)'}"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
			<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
			<polyline points="22 4 12 14.01 9 17" />
		</svg>
		Been
	</button>
	<button
		type="button"
		onclick={toggleSearch}
		aria-label="Search"
		class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition {searchActive &&
		sheetOpen
			? 'text-(--accent-strong)'
			: 'text-(--muted)'}"
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		Search
	</button>
	<div class="flex flex-1 flex-col items-center justify-center gap-1">
		<UserMenu placement="above" compact />
		<span class="text-xs font-medium text-(--muted)">Profile</span>
	</div>
</nav>
