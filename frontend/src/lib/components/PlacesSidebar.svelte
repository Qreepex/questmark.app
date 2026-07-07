<script lang="ts">
	import { formatCoordinate } from '$lib/dashboard';
	import type { PlaceRecord } from '$lib/types';

	let {
		places = [],
		onEdit = () => {},
		onDelete = () => {}
	} = $props<{
		places?: PlaceRecord[];
		onEdit?: (place: PlaceRecord) => void;
		onDelete?: (place: PlaceRecord) => void;
	}>();

	let open = $state(true);
</script>

<section
	class="pointer-events-auto overflow-hidden rounded-3xl border border-white/10 bg-(--panel) shadow-2xl shadow-black/40 backdrop-blur"
>
	<button
		onclick={() => (open = !open)}
		class="flex w-full items-center justify-between px-4 py-3 text-left"
	>
		<div>
			<p class="text-[0.65rem] uppercase tracking-[0.45em] text-slate-400">Places</p>
			<h2 class="mt-1 text-base font-semibold text-white">Marked places</h2>
		</div>
		<div class="flex items-center gap-3">
			<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
				>{places.length}</span
			>
			<span class="text-slate-400">{open ? '−' : '+'}</span>
		</div>
	</button>
	{#if open}
		<div class="max-h-[calc(100vh-15rem)] overflow-y-auto border-t border-white/10 p-2">
			{#each places as place}
				<article
					class="mb-2 rounded-[1.2rem] border border-white/8 bg-white/5 px-3 py-3 transition hover:border-cyan-300/25 hover:bg-white/8"
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-sm font-medium text-white">{place.name}</div>
							<p class="mt-1 text-xs text-slate-400">
								{formatCoordinate(place.latitude, 4)}, {formatCoordinate(place.longitude, 4)}
							</p>
						</div>
						<button
							onclick={() => onEdit(place)}
							class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
						>
							Edit
						</button>
					</div>
					{#if place.description}
						<p class="mt-3 line-clamp-2 text-sm text-slate-300">{place.description}</p>
					{/if}
					<div class="mt-3 flex items-center justify-between gap-3">
						<div
							class="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500"
						>
							{#if place.imageUrls?.length}
								<span>{place.imageUrls.length} images</span>
							{/if}
							{#if place.socialUrls?.length}
								<span>{place.socialUrls.length} links</span>
							{/if}
						</div>
						<button
							onclick={() => onDelete(place)}
							class="text-xs text-rose-300 transition hover:text-rose-200">Delete</button
						>
					</div>
				</article>
			{/each}
			{#if places.length === 0}
				<p class="px-3 py-4 text-sm text-slate-500">No saved places yet.</p>
			{/if}
		</div>
	{:else}
		<div class="border-t border-white/10 px-4 py-3 text-sm text-slate-400">
			Collapsed. Open to browse your saved pins.
		</div>
	{/if}
</section>
