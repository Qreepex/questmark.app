import { getBackendUrl } from './client';

const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

async function shrinkImage(file: File | Blob): Promise<File | Blob> {
	if (file.size <= MAX_IMAGE_BYTES) {
		return file;
	}

	const bitmap = await createImageBitmap(file);
	let width = bitmap.width;
	let height = bitmap.height;
	let quality = 0.9;
	let shrunk: Blob | null = null;

	for (let attempt = 0; attempt < 8; attempt += 1) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');
		if (!context) {
			break;
		}

		context.drawImage(bitmap, 0, 0, width, height);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', quality)
		);

		if (!blob) {
			break;
		}

		shrunk = blob;

		if (blob.size <= MAX_IMAGE_BYTES) {
			break;
		}

		if (quality > 0.5) {
			quality -= 0.15;
		} else {
			width = Math.round(width * 0.75);
			height = Math.round(height * 0.75);
		}
	}

	return shrunk ?? file;
}

export async function uploadImage(token: string, file: File | Blob): Promise<string> {
	const formData = new FormData();
	formData.append('image', await shrinkImage(file));

	const response = await fetch(`${getBackendUrl()}/uploads/image`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}` },
		body: formData
	});

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
		throw new Error(errorBody?.error ?? `Upload failed with status ${response.status}`);
	}

	const result = (await response.json()) as { url: string };
	return result.url;
}
