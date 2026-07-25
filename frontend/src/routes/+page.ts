// Prerendered at build time so crawlers see real landing-page content and
// og:*/twitter:*/JSON-LD meta instead of an empty SPA shell. Now that the app
// deploys as a real Worker (see wrangler.toml), this no longer conflicts with
// routing to other pages like /auth/callback - the Worker matches the real
// route tree instead of blindly serving index.html for every unmatched path.
export const prerender = true;
export const ssr = true;
