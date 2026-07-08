import { reverseGeocodeLocation } from '$lib/api/geo';
import type { PlaceRecord } from '$lib/types';

const countryCodeCache = new Map<string, string | null>();

function cacheKeyFor(place: Pick<PlaceRecord, 'latitude' | 'longitude'>): string {
	return `${place.latitude},${place.longitude}`;
}

class PlaceViewerStore {
	place = $state<PlaceRecord | null>(null);
	countryCode = $state<string | null>(null);

	async open(place: PlaceRecord): Promise<void> {
		this.place = place;
		this.countryCode = countryCodeCache.get(cacheKeyFor(place)) ?? null;

		if (countryCodeCache.has(cacheKeyFor(place))) {
			return;
		}

		try {
			const result = await reverseGeocodeLocation(place.latitude, place.longitude);
			const countryCode = result.countryCode ?? null;
			countryCodeCache.set(cacheKeyFor(place), countryCode);

			if (this.place?.id === place.id) {
				this.countryCode = countryCode;
			}
		} catch {
			countryCodeCache.set(cacheKeyFor(place), null);
		}
	}

	close(): void {
		this.place = null;
		this.countryCode = null;
	}
}

export const placeViewer = new PlaceViewerStore();
