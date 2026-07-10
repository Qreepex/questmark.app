class WrappedFiltersStore {
	year = $state<number | 'all'>('all');
	yearTouched = $state(false);
	countryCodes = $state<string[]>([]);
	continents = $state<string[]>([]);
	tags = $state<string[]>([]);

	setYear(year: number | 'all'): void {
		this.year = year;
		this.yearTouched = true;
	}

	toggleTag(tag: string): void {
		this.tags = this.tags.includes(tag)
			? this.tags.filter((existing) => existing !== tag)
			: [...this.tags, tag];
	}

	reset(): void {
		this.year = 'all';
		this.yearTouched = false;
		this.countryCodes = [];
		this.continents = [];
		this.tags = [];
	}
}

export const wrappedFilters = new WrappedFiltersStore();
