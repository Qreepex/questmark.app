import { getBackendUrl } from './client';

export async function uploadImage(token: string, file: File | Blob): Promise<string> {
	const formData = new FormData();
	formData.append('image', file);

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
