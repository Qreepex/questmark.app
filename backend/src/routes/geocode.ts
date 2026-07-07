import { Router } from 'express';

const geocodeRouter = Router();

geocodeRouter.get('/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';

  if (!query) {
    response.status(400).json({ error: 'Query is required' });
    return;
  }

  const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
  searchUrl.searchParams.set('format', 'jsonv2');
  searchUrl.searchParams.set('addressdetails', '1');
  searchUrl.searchParams.set('limit', '8');
  searchUrl.searchParams.set('q', query);

  // TODO: cache / rate limit

  const upstreamResponse = await fetch(searchUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'WantToGo/1.0 (https://go.schiemann.work)',
      "Referer": "https://go.schiemann.work"
    }
  });

  if (!upstreamResponse.ok) {
    const body = await upstreamResponse.text();
    console.error(`Geocoding service failed: ${upstreamResponse.status} ${upstreamResponse.statusText} - ${body}`);

    response.status(502).json({ error: 'Geocoding service failed' });
    return;
  }

  const results = (await upstreamResponse.json()) as Array<{
    name?: string;
    display_name?: string;
    lat: string;
    lon: string;
  }>;

  response.json({
    results: results.map((entry) => ({
      name: entry.name ?? entry.display_name ?? query,
      displayName: entry.display_name ?? entry.name ?? query,
      latitude: Number(entry.lat),
      longitude: Number(entry.lon)
    }))
  });
});

export default geocodeRouter;