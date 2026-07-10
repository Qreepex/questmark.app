import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
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

			// The app has no server-side load functions or +server.ts endpoints, so it's
			// deployed as a static SPA to Cloudflare Workers (see wrangler.toml). The
			// `fallback` page handles dynamic routes like /lists/join/[token] client-side.
			// See https://svelte.dev/docs/kit/single-page-apps
			//
			// `/privacy` and `/legal-notice` are prerendered (see their +page.ts files)
			// so crawlers get real og:*/twitter:* meta without running JS. `/` is
			// intentionally NOT prerendered, even though it'd be nice for SEO too:
			// Cloudflare's `single-page-application` not_found_handling always serves
			// `index.html` verbatim for unmatched routes (there's no way to point it at
			// a differently-named fallback instead). If `/` were prerendered,
			// `index.html` would contain a hydration payload for the landing page, and
			// any hard-loaded route that isn't its own static file (e.g. /auth/callback,
			// reached via an external OAuth redirect) would hydrate as the landing page
			// instead of routing to the real component. Keeping `/` client-rendered like
			// everything else means the fallback (named `index.html`, the adapter
			// default) is a plain SPA shell, so it always lands on the correct
			// client-side route regardless of which path it's served for.
			adapter: adapter({
				fallback: 'index.html'
			}),

			// Emit absolute (root-relative) asset paths instead of the default
			// relative ones. Relative paths break for deep routes like
			// /lists/join/[token]: when Cloudflare's SPA fallback serves
			// index.html/200.html there, `./_app/...` resolves against
			// `/lists/join/`, 404s, and gets re-served as index.html again -
			// which the browser rejects as a JS module (wrong MIME type).
			paths: {
				relative: false
			}
		})
	]
});
