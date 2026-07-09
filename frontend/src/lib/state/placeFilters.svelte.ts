class PlaceFiltersStore {
	listId = $state<string | null>(null);
	countryCode = $state<string | null>(null);
	continent = $state<string | null>(null);
	tags = $state<string[]>([]);

	toggleTag(tag: string): void {
		this.tags = this.tags.includes(tag)
			? this.tags.filter((existing) => existing !== tag)
			: [...this.tags, tag];
	}

	reset(): void {
		this.listId = null;
		this.countryCode = null;
		this.continent = null;
		this.tags = [];
	}
}

export const placeFilters = new PlaceFiltersStore();
