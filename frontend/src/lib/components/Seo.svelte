<script lang="ts">
	import { page } from '$app/state';
	import { defaultDescription, defaultOgImage, siteName, siteUrl, tagline } from '$lib/config/site';

	let {
		title,
		description = defaultDescription,
		image = defaultOgImage,
		imageAlt = tagline,
		type = 'website',
		noindex = false,
		jsonLd
	}: {
		title: string;
		description?: string;
		image?: string;
		imageAlt?: string;
		type?: 'website' | 'article';
		noindex?: boolean;
		/** Optional schema.org structured data, rendered as a JSON-LD script tag. */
		jsonLd?: Record<string, unknown>;
	} = $props();

	let fullTitle = $derived(title === siteName ? title : `${title} · ${siteName}`);
	let canonicalUrl = $derived(`${siteUrl}${page.url.pathname}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content={type} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={imageAlt} />

	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>`}
	{/if}
</svelte:head>
