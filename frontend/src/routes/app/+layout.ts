// The authenticated app reads its session from localStorage and fetches
// everything from the backend API client-side - there's nothing meaningful to
// render on the server, and it's excluded from search indexing (see
// robots.txt) anyway.
export const ssr = false;
