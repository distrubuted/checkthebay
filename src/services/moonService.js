import { getForecast, NWS_DEFAULT_COORDS } from "./nwsClient.js";

const cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheFresh() {
  return cache.value && cache.expiresAt > Date.now();
}

function fallback(reason, updatedAt = new Date().toISOString()) {
  return {
    phase: "Unavailable",
    illumination: null,
    moonrise: null,
    moonset: null,
    updatedAt,
    stale: true,
    note: reason ? `NWS data unavailable: ${reason}` : "NWS data unavailable"
  };
}

export async function getMoonPhase() {
  if (cacheFresh()) return cache.value;
  try {
    const forecast = await getForecast(NWS_DEFAULT_COORDS);
    const updatedAt = forecast?.properties?.updated || new Date().toISOString();
    // NWS forecast does not provide moon data; return an informative placeholder.
    const result = fallback("Moon data not provided by NWS", updatedAt);
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  } catch (err) {
    console.error(`NWS moon phase error: ${err.message}`);
    const result = fallback(err.message);
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  }
}
