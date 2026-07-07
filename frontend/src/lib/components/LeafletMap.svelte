<script lang="ts">
	import type { PlaceRecord } from '$lib/types';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';

	type MapSelection = {
		name: string;
		latitude: number;
		longitude: number;
	} | null;

	let {
		places = [],
		selection = null,
		onPick = () => {}
	} = $props<{
		places?: PlaceRecord[];
		selection?: MapSelection;
		onPick?: (selection: { latitude: number; longitude: number }) => void;
	}>();

	let container: HTMLDivElement | null = null;
	let map: import('leaflet').Map | null = null;
	let markerLayer: import('leaflet').LayerGroup | null = null;
	let leafletModule: typeof import('leaflet') | null = null;

	onMount(async () => {
		leafletModule = await import('leaflet');

		if (!container) {
			return;
		}

		map = leafletModule
			.map(container, { zoomControl: false, preferCanvas: true })
			.setView([20, 0], 2);
		leafletModule
			.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			})
			.addTo(map);
		markerLayer = leafletModule.layerGroup().addTo(map);

		map.on('click', (event) => {
			onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
		});

		renderLayers();

		return () => {
			map?.remove();
			map = null;
			markerLayer = null;
		};
	});

	function renderLayers() {
		if (!map || !markerLayer || !leafletModule) {
			return;
		}

		markerLayer.clearLayers();

		const pinIcon = leafletModule.divIcon({
			className: '',
			html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-cyan-400 shadow-lg shadow-cyan-950/60"></div>',
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		});

		const activeIcon = leafletModule.divIcon({
			className: '',
			html: '<div class="h-5 w-5 rounded-full border-2 border-white bg-amber-400 shadow-lg shadow-amber-950/60"></div>',
			iconSize: [20, 20],
			iconAnchor: [10, 10]
		});

		const bounds = leafletModule.latLngBounds([]);

		for (const place of places) {
			const marker = leafletModule
				.marker([place.latitude, place.longitude], { icon: pinIcon })
				.addTo(markerLayer);
			marker.bindPopup(`<strong>${escapeHtml(place.name)}</strong>`);
			bounds.extend([place.latitude, place.longitude]);
		}

		if (selection) {
			leafletModule
				.marker([selection.latitude, selection.longitude], { icon: activeIcon })
				.addTo(markerLayer);
			bounds.extend([selection.latitude, selection.longitude]);
			map.setView([selection.latitude, selection.longitude], Math.max(map.getZoom(), 10), {
				animate: true
			});
		}

		if (bounds.isValid() && !selection) {
			map.fitBounds(bounds.pad(0.2), { animate: true });
		}
	}

	function escapeHtml(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	$effect(() => {
		places;
		selection;

		if (!leafletModule) {
			return;
		}

		renderLayers();
	});
</script>

<div
	bind:this={container}
	class="h-full min-h-[420px] w-full rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-950/40"
></div>
