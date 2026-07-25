import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function getCommitHash(): string {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
}

export default defineConfig({
	define: {
		__COMMIT_HASH__: JSON.stringify(getCommitHash())
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Deploys as a real Cloudflare Worker (see wrangler.toml) instead of a
			// static-assets-only SPA. Marketing/SEO routes (`/`, `/privacy`,
			// `/legal-notice`, `/faq`) are prerendered to static HTML at build time
			// (see their +page.ts files) so crawlers get real content and og:*/
			// twitter:*/JSON-LD meta without running JS. The authenticated app
			// (`/app`, `/auth/callback`, `/lists/join/[token]`) opts out of SSR
			// per-route (ssr = false) since it reads the auth token from
			// localStorage and is irrelevant to search indexing anyway - the Worker
			// still routes requests for it correctly (unlike the old static-adapter
			// fallback, which blindly served index.html for every unmatched path).
			adapter: adapter(),

			// Emit absolute (root-relative) asset paths instead of the default
			// relative ones, so asset URLs resolve correctly regardless of how
			// deep the current route is (e.g. /lists/join/[token]).
			paths: {
				relative: false
			}
		})
	]
});
