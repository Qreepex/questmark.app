<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { uploadImage } from '$lib/api';
	import { closeEditor, savePlace } from '$lib/dashboard/actions';
	import { appendLines, extractUrls, formatCoordinate } from '$lib/dashboard/helpers';
	import { placeEditor } from '$lib/state/placeEditor.svelte';
	import { session } from '$lib/state/session.svelte';
	import { statusStore } from '$lib/state/status.svelte';

	const previewTitle = $derived(
		placeEditor.selection?.displayName ?? placeEditor.selection?.name ?? 'Pinned location'
	);

	let isUploadingImage = $state(false);

	async function handlePaste(event: ClipboardEvent) {
		const clipboardData = event.clipboardData;

		if (!clipboardData) {
			return;
		}

		const imageItem = Array.from(clipboardData.items).find(
			(item) => item.kind === 'file' && item.type.startsWith('image/')
		);

		if (imageItem) {
			event.preventDefault();
			const file = imageItem.getAsFile();

			if (file) {
				await uploadPastedImage(file);
			}

			return;
		}

		const target = event.target;
		const isDedicatedField =
			target instanceof HTMLElement && target.closest('[data-paste-passthrough]');

		if (isDedicatedField) {
			return;
		}

		const text = clipboardData.getData('text/plain').trim();

		if (!text) {
			return;
		}

		event.preventDefault();

		const existingDescription = placeEditor.draft.description.trim();
		placeEditor.draft.description = existingDescription
			? `${existingDescription}\n\n${text}`
			: text;

		const urls = extractUrls(text);

		if (urls.length) {
			placeEditor.draft.socialUrls = appendLines(placeEditor.draft.socialUrls, urls);
		}
	}

	async function uploadPastedImage(file: File): Promise<void> {
		if (!session.token) {
			statusStore.show('Sign in to upload images.');
			return;
		}

		isUploadingImage = true;
		statusStore.clear();

		try {
			const key = await uploadImage(session.token, file);
			placeEditor.draft.imageUrls = appendLines(placeEditor.draft.imageUrls, [key]);
		} catch (error) {
			statusStore.show(error instanceof Error ? error.message : 'Unable to upload image');
		} finally {
			isUploadingImage = false;
		}
	}
</script>

{#if placeEditor.selection}
	<div
		class="pointer-events-auto fixed bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-6 sm:w-96"
		onpaste={handlePaste}
	>
		<Panel floating>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-xs text-(--accent-strong)">
						{placeEditor.mode === 'edit' ? 'Edit place' : 'Pinned location'}
					</p>
					<h2 class="mt-1 text-lg font-semibold text-(--text)">{previewTitle}</h2>
					<p class="mt-1 text-xs text-(--muted-dim)">
						{formatCoordinate(placeEditor.selection.latitude, 5)}, {formatCoordinate(
							placeEditor.selection.longitude,
							5
						)}
					</p>
				</div>
				<button onclick={closeEditor} class="text-sm text-(--muted) transition hover:text-(--text)">
					Close
				</button>
			</div>

			<div class="mt-4 grid gap-3">
				<div data-paste-passthrough>
					<TextField
						label="Name"
						bind:value={placeEditor.draft.name}
						placeholder="A place you want to remember"
					/>
				</div>
				<TextArea
					label="Description"
					bind:value={placeEditor.draft.description}
					placeholder="Why is this on your list? Paste text or images here."
				/>
				<div class="grid gap-3 sm:grid-cols-2">
					<div data-paste-passthrough>
						<TextArea
							label="Image URLs"
							bind:value={placeEditor.draft.imageUrls}
							placeholder="One URL per line"
						/>
					</div>
					<div data-paste-passthrough>
						<TextArea
							label="Social URLs"
							bind:value={placeEditor.draft.socialUrls}
							placeholder="TikTok, Instagram, or a post link"
						/>
					</div>
				</div>
				{#if isUploadingImage}
					<p class="text-xs text-(--muted-dim)">Uploading pasted image…</p>
				{/if}
				<Button
					onclick={savePlace}
					disabled={placeEditor.isSaving}
					class="mt-1 w-full"
				>
					{placeEditor.isSaving ? 'Saving…' : placeEditor.mode === 'edit' ? 'Update place' : 'Save place'}
				</Button>
			</div>
		</Panel>
	</div>
{/if}
