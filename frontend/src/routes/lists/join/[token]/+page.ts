// Joining a shared list requires the signed-in user's session from
// localStorage; nothing to render on the server, and it's excluded from
// search indexing (see robots.txt).
export const ssr = false;
