import { readCache, writeCache } from '../cache/cache.js';
import { scrapeTide } from '../scrapers/tideScraper.js';
import { scrapeWeather } from '../scrapers/weatherScraper.js';
import { scrapeWind } from '../scrapers/windScraper.js';
import { scrapeMarine } from '../scrapers/marineScraper.js';
import { scrapeMoon } from '../scrapers/moonScraper.js';
import { scrapeRadar } from '../scrapers/radarScraper.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10 * 60 * 1000);
const LOCATION_NAME = 'Point Clear / Mobile Bay, AL';

let currentConditions = null;
let pollTimer = null;

function createEmptyConditions({ updatedAt = new Date().toISOString(), stale = true, errors = [] } = {}) {
  return {
    updatedAt,
    tide: {
      currentFt: null,
      nextHigh: null,
      nextLow: null,
      trend: null,
    },
    weather: {
      tempF: null,
      feelsLikeF: null,
      humidityPct: null,
      visibilityMi: null,
      summary: null,
    },
    wind: {
      speedMph: null,
      gustMph: null,
      directionDeg: null,
      directionCardinal: null,
    },
    marine: {
      waveHeightFt: null,
      summary: null,
    },
    moon: {
      phase: null,
      illuminationPct: null,
      moonrise: null,
      moonset: null,
    },
    radar: {
      imageUrl: null,
      updatedAt: null,
    },
    stale,
    errors,
  };
}

async function collectConditions() {
  const combinedErrors = [];
  const conditions = createEmptyConditions({ stale: false, errors: [] });
  conditions.updatedAt = new Date().toISOString();

  const scrapers = [
    { name: 'tide', run: scrapeTide },
    { name: 'weather', run: scrapeWeather },
    { name: 'wind', run: scrapeWind },
    { name: 'marine', run: scrapeMarine },
    { name: 'moon', run: scrapeMoon },
    { name: 'radar', run: scrapeRadar },
  ];

  for (const scraper of scrapers) {
    try {
      const result = await scraper.run();
      if (result) {
        Object.entries(result).forEach(([key, value]) => {
          if (key === 'errors') return;
          if (conditions[key]) {
            conditions[key] = { ...conditions[key], ...value };
          }
        });
        if (Array.isArray(result.errors)) {
          combinedErrors.push(...result.errors);
        }
      }
    } catch (error) {
      combinedErrors.push(`${scraper.name} scraper error: ${error.message}`);
    }
  }

  conditions.errors = combinedErrors;
  return { conditions, errors: combinedErrors };
}

export async function initializeConditions() {
  if (currentConditions) return currentConditions;

  const cached = await readCache();
  if (cached) {
    currentConditions = { ...createEmptyConditions({ stale: true, errors: [] }), ...cached, errors: cached.errors || [] };
    console.log(`[polling] Loaded cached conditions for ${LOCATION_NAME}`);
  } else {
    currentConditions = createEmptyConditions({ stale: true });
    await writeCache(currentConditions);
    console.warn('[polling] No cache found. Seeded empty conditions payload.');
  }

  return currentConditions;
}

async function persist(payload) {
  currentConditions = payload;
  await writeCache(payload);
}

export function getCurrentConditions() {
  return currentConditions || createEmptyConditions({ stale: true });
}

export async function pollOnce() {
  await initializeConditions();
  const previous = currentConditions;

  try {
    const { conditions, errors } = await collectConditions();

    if (errors.length) {
      const stalePayload = {
        ...(previous || conditions),
        stale: true,
        errors: [...(previous?.errors || []), ...errors],
        updatedAt: previous?.updatedAt || conditions.updatedAt,
      };
      await persist(stalePayload);
      console.warn(`[polling] Polling completed with errors; serving cached data for ${LOCATION_NAME}.`);
      return stalePayload;
    }

    const freshPayload = { ...conditions, stale: false, errors: [] };
    await persist(freshPayload);
    console.log(`[polling] Polling succeeded for ${LOCATION_NAME} at ${freshPayload.updatedAt}.`);
    return freshPayload;
  } catch (error) {
    const fallback = previous || createEmptyConditions({ stale: true });
    const stalePayload = {
      ...fallback,
      stale: true,
      updatedAt: fallback.updatedAt || new Date().toISOString(),
      errors: [...(fallback.errors || []), `Polling failed: ${error.message}`],
    };
    await persist(stalePayload);
    console.error(`[polling] Polling failed for ${LOCATION_NAME}: ${error.message}`);
    return stalePayload;
  }
}

export async function startPolling() {
  await initializeConditions();
  await pollOnce();

  pollTimer = setInterval(() => {
    pollOnce();
  }, POLL_INTERVAL_MS);

  console.log(`[polling] Started polling loop every ${Math.round(POLL_INTERVAL_MS / 60000)} minutes.`);
  return pollTimer;
}
