export const CATEGORICAL: string[] = [
	'#3987e5', // 1 blue
	'#199e70', // 2 aqua
	'#c98500', // 3 yellow
	'#008300', // 4 green
	'#9085e9', // 5 violet
	'#e66767', // 6 red
	'#d55181', // 7 magenta
	'#d95926' // 8 orange
];

// Continents are assigned fixed slots in their canonical order (see continents.ts),
// so a continent's color is stable everywhere it appears (doughnut, meters, map).
const CONTINENT_SLOT: Record<string, string> = {
	AF: CATEGORICAL[0],
	AN: CATEGORICAL[1],
	AS: CATEGORICAL[2],
	EU: CATEGORICAL[3],
	NA: CATEGORICAL[4],
	OC: CATEGORICAL[5],
	SA: CATEGORICAL[6]
};

export function getContinentColor(code: string): string {
	return CONTINENT_SLOT[code] ?? CATEGORICAL[7];
}

// Single-hue accents for the magnitude bar charts (one flat color per chart,
// not per bar — bar length already encodes the value).
export const CHART_ACCENTS = {
	countries: CATEGORICAL[0],
	tags: CATEGORICAL[2],
	months: CATEGORICAL[1],
	years: CATEGORICAL[7]
};

export function hexToRgba(hex: string, alpha: number): string {
	const value = hex.replace('#', '');
	const r = parseInt(value.slice(0, 2), 16);
	const g = parseInt(value.slice(2, 4), 16);
	const b = parseInt(value.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
