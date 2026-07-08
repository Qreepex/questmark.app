<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { closeViewer, editViewedPlace } from '$lib/dashboard/actions';
	import { countryCodeToFlagEmoji, getUrlDomain } from '$lib/dashboard/helpers';
	import { placeViewer } from '$lib/state/placeViewer.svelte';

	const flag = $derived(countryCodeToFlagEmoji(placeViewer.countryCode));

	let lightboxUrl = $state<string | null>(null);
</script>

{#if placeViewer.place}
	{@const place = placeViewer.place}
	<div
		class="pointer-events-auto fixed bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-6 sm:w-96"
	>
		<Panel floating>
			<div class="flex items-start justify-between gap-3">
				<div class="flex min-w-0 items-center gap-2">
					{#if flag}
						<span class="text-xl leading-none">{flag}</span>
					{/if}
					<h2 class="truncate text-lg font-semibold text-(--text)">{place.name}</h2>
				</div>
				<button
					onclick={closeViewer}
					class="shrink-0 text-sm text-(--muted) transition hover:text-(--text)"
				>
					Close
				</button>
			</div>

			{#if place.description}
				{@const processedDescription = (() => {
					let text = place.description.trim();

					place.socialUrls?.forEach((url) => {
						const domain = getUrlDomain(url);

						if (domain) {
							// Escaped die URL, damit sie sicher im Regex verwendet werden kann
							const escapedUrl = url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
							// Findet die komplette URL im Text
							const regex = new RegExp(escapedUrl, 'g');

							// Das HTML nutzt die volle URL für href, zeigt aber nur die Domain an
							const linkHtml = `<a href="${url}" target="_blank" rel="noreferrer noopener" class="align-bottom inline-block truncate font-semibold text-(--accent-strong) underline decoration-(--accent-strong)/40 hover:text-(--accent-strong-hover) transition-colors">${domain}</a>`;

							text = text.replace(regex, linkHtml);
						}
					});

					return text;
				})()}
				<p class="mt-2 text-sm text-(--muted)">
					{@html processedDescription}
				</p>
			{/if}

			{#if place.imageUrls?.length}
				<div class="mt-4 grid grid-cols-3 gap-2">
					{#each place.imageUrls as imageUrl (imageUrl)}
						<button
							type="button"
							onclick={() => (lightboxUrl = imageUrl)}
							aria-label="Enlarge image"
							class="aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg"
						>
							<img
								src={imageUrl}
								alt=""
								class="h-full w-full object-cover transition hover:opacity-90"
							/>
						</button>
					{/each}
				</div>
			{/if}

			{#if place.socialUrls?.length}
				<ul class="mt-4 grid gap-1.5">
					{#each place.socialUrls as url (url)}
						<li class="min-w-0">
							<a
								href={url}
								target="_blank"
								rel="noreferrer noopener"
								class="inline-block truncate text-sm font-medium text-(--accent-strong) underline decoration-(--accent-strong)/40 underline-offset-2 hover:decoration-(--accent-strong)"
							>
								{getUrlDomain(url)}
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<button
				onclick={editViewedPlace}
				class="mt-4 w-full rounded-full border border-(--border) py-2 text-xs uppercase tracking-wide text-(--muted) transition hover:border-(--border-strong) hover:text-(--text)"
			>
				Edit place
			</button>
		</Panel>
	</div>
{/if}

{#if lightboxUrl}
	<button
		type="button"
		onclick={() => (lightboxUrl = null)}
		aria-label="Close image preview"
		class="pointer-events-auto fixed inset-0 z-1100 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
	>
		<span class="absolute right-4 top-4 text-3xl leading-none text-white/80">×</span>
		<img src={lightboxUrl} alt="" class="max-h-full max-w-full rounded-lg object-contain" />
	</button>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			lightboxUrl = null;
		}
	}}
/>
