<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api/token';
	import Landing from '$lib/components/Landing.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { defaultDescription, siteName, siteUrl } from '$lib/config/site';
	import { onMount } from 'svelte';

	// Renders the marketing page by default so it's fully present in the
	// prerendered HTML for crawlers and first paint. Already-signed-in visitors
	// get redirected client-side after mount instead - a brief flash for the
	// rare returning user is worth it for correct SEO on the far more common
	// anonymous visit.
	let redirecting = $state(false);

	onMount(() => {
		if (getStoredToken()) {
			redirecting = true;
			goto('/app');
		}
	});

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: siteName,
		url: siteUrl,
		description: defaultDescription,
		applicationCategory: 'TravelApplication',
		operatingSystem: 'Any (web-based)',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	};
</script>

<Seo title={siteName} {jsonLd} />

{#if redirecting}
	<main class="flex h-screen items-center justify-center">
		<Spinner />
	</main>
{:else}
	<Landing />
{/if}
