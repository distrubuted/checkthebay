# CheckTheBay Backend (Clean Rebuild)

A lightweight Express backend for CheckTheBay providing tides, conditions, stations, and inshore reef data with a WorldTides-powered polling loop.

## Endpoints (base path `/api`)
- `GET /api/tides` — Tide extremes and hourly heights (query `lat`, `lon` optional; defaults to Point Clear, AL).
- `GET /api/conditions` — Current snapshot saved by the poller.
- `GET /api/conditions/tides` — Same as `/api/tides` for legacy callers.
- `GET /api/stations` — Station list from `data/stations.json`.
- `GET /api/reefs/inshore` — Inshore reef list from `data/reefs-inshore.json`.

## WorldTides Integration
- Uses `WORLD_TIDES_API_KEY` environment variable.
- Caches responses for 6 minutes; falls back to cached or bundled sample data when unavailable.
- Normalizes to `{ updatedAt, currentHeight, nextHigh, nextLow, extremes[], hourly[] }`.

## Polling
- Background poller runs every 10 minutes to refresh tides and snapshot data.
- Weather polling is intentionally disabled until a stable upstream API is approved.

## Running locally
```bash
npm install
npm start
# Server listens on PORT (default 8787) and mounts routes at /api
```

## Render Deployment
1. Create a new Web Service on Render, pointing to this repo.
2. Set **Build Command** to `npm install`.
3. Set **Start Command** to `node src/server.js`.
4. Add environment variables:
   - `PORT` (Render auto-assigns; leave default or set to 10000+ as needed)
   - `WORLD_TIDES_API_KEY` (your WorldTides key)
5. Deploy — Render will expose the public HTTPS URL. Example: `https://<app>.onrender.com/api/tides`.

## Files
- `src/server.js` — Express app, base router, and polling scheduler.
- `src/api/` — Route handlers for tides, conditions, stations, reefs.
- `src/lib/worldTides.js` — WorldTides client with caching and sample fallback.
- `src/lib/normalize.js` — Tide normalization helpers.
- `src/lib/snapshotStore.js` — In-memory + JSON file snapshot store.
- `src/pollers/` — Polling orchestration for tides and conditions.
- `data/` — Stations, reefs, and sample tide data.

## Environment variables
- `PORT` — Server port (defaults to 8787).
- `WORLD_TIDES_API_KEY` — Required for live tide data; if unset, sample data is served.
