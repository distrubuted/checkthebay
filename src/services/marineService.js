import { getForecast, NWS_DEFAULT_COORDS } from "./nwsClient.js";

const cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheFresh() {
  return cache.value && cache.expiresAt > Date.now();
}

function fallback(reason) {
  const updatedAt = new Date().toISOString();
  return {
    summary: `Unavailable${reason ? `: ${reason}` : ""}`,
    waveHeight: null,
    updatedAt,
    stale: true
  };
}

function parseWaveHeight(text) {
  if (!text) return null;
  const match = text.match(/(\d+(?:\.\d+)?)\s?(?:to\s?(\d+(?:\.\d+)?))?\s?(?:ft|feet|foot)/i);
  if (match) {
    const low = parseFloat(match[1]);
    const high = match[2] ? parseFloat(match[2]) : null;
    if (high !== null) return `${low}-${high} ft`;
    return `${low} ft`;
  }
  return null;
}

export async function getMarineForecast() {
  if (cacheFresh()) return cache.value;
  try {
    const forecast = await getForecast(NWS_DEFAULT_COORDS);
    const period = forecast?.properties?.periods?.[0];
    const summary = period?.shortForecast || "Unavailable";
    const waveHeight = parseWaveHeight(period?.detailedForecast || "") || null;
    const updatedAt = forecast?.properties?.updated || new Date().toISOString();

    const result = { summary, waveHeight: waveHeight ?? period?.detailedForecast ?? null, updatedAt };
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  } catch (err) {
    console.error(`NWS marine forecast error: ${err.message}`);
    const result = fallback(err.message);
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  }
}
