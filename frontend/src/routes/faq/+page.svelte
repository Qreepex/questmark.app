<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { siteName } from '$lib/config/site';

	const faqs = [
		{
			question: `What is ${siteName}?`,
			answer: `${siteName} is a map-based bucket list. Pin the places you want to visit, keep notes and photos, and track everywhere you've already been.`
		},
		{
			question: `Is ${siteName} free to use?`,
			answer: `Yes, ${siteName} is free to use.`
		},
		{
			question: 'Do I need a password to sign in?',
			answer:
				'No. Sign-in uses secure single sign-on (OAuth) — there is no separate password to create or remember.'
		},
		{
			question: 'Can I share my list with friends or family?',
			answer:
				'Yes. Create a shared list and invite people with a link, and choose whether they can view, add, or edit it.'
		},
		{
			question: "Does it track the places I've already visited?",
			answer:
				'Yes. Log a visit with a date and notes, see visited countries highlighted on the map, and browse your trips as a timeline.'
		},
		{
			question: 'Is my data private?',
			answer:
				'Yes. Your places and lists are tied to your account and are never shown to anyone else unless you explicitly share them.'
		},
		{
			question: `Does ${siteName} work on mobile?`,
			answer:
				'Yes. The map, search, and your lists are all optimized for small screens, with a bottom navigation bar for quick switching between "Want to go" and "Been".'
		},
		{
			question: 'How do I delete my account and data?',
			answer: 'Email dev@qreepex.xyz and we will delete your account and all associated data.'
		}
	];

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	};
</script>

<Seo
	title="Frequently Asked Questions"
	description="Answers to common questions about {siteName} — signing in, sharing lists, tracking visits, and privacy."
	{jsonLd}
/>

<main class="flex h-screen justify-center overflow-y-auto px-6 py-10">
	<div class="w-full max-w-3xl">
		<nav class="mb-6 flex items-center gap-4 text-sm text-(--muted)">
			<a href="/" class="hover:text-(--text)">&larr; Back to {siteName}</a>
			<a href="/privacy" class="hover:text-(--text)">Privacy Policy</a>
			<a href="/legal-notice" class="hover:text-(--text)">Legal Notice</a>
		</nav>

		<Panel class="space-y-6">
			<div>
				<h1 class="text-3xl font-semibold tracking-tight text-(--text) md:text-4xl">
					Frequently Asked Questions
				</h1>
				<p class="mt-2 text-sm text-(--muted-dim)">
					Everything you need to know about using {siteName}.
				</p>
			</div>

			{#each faqs as faq (faq.question)}
				<section class="space-y-2 border-t border-(--border) pt-4 first:border-t-0 first:pt-0">
					<h2 class="text-lg font-semibold text-(--text)">{faq.question}</h2>
					<p class="text-sm text-(--muted) md:text-base">{faq.answer}</p>
				</section>
			{/each}

			<div class="border-t border-(--border) pt-4 text-sm text-(--muted)">
				Still have questions? Reach out at
				<a href="mailto:dev@qreepex.xyz" class="text-(--accent-strong) underline">dev@qreepex.xyz</a
				>.
			</div>
		</Panel>
	</div>
</main>
