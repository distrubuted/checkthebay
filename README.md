# Did You Check The Bay — Scraper Backend

A scraper-focused Node.js backend that polls public sources for Point Clear / Mobile Bay, AL and serves a consolidated JSON payload for Base44.

## Endpoints (base path `/api`)
- `GET /api/health` → `{ ok: true }`
- `GET /api/conditions` → Latest cached bay conditions payload.

## Data shape
`/api/conditions` returns:
```
{
  updatedAt: ISO_STRING,
  tide: { currentFt, nextHigh, nextLow, trend },
  weather: { tempF, feelsLikeF, humidityPct, visibilityMi, summary },
  wind: { speedMph, gustMph, directionDeg, directionCardinal },
  marine: { waveHeightFt, summary },
  moon: { phase, illuminationPct, moonrise, moonset },
  radar: { imageUrl, updatedAt },
  stale: boolean,
  errors: string[]
}
```
Missing values are `null` but keys remain.

## Running locally
```bash
npm install
npm start
# Server listens on PORT (default 8787)
```

## Polling and cache
- Polls every 10 minutes for fresh conditions.
- Keeps last good payload in memory **and** `data/conditions-cache.json` for cold starts.
- Logs polling success/failure to stdout for Render visibility.

## Docker
Render-friendly image example:
```
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/server.js"]
```
