import {
  getLatestObservation,
  toFahrenheit,
  metersToMiles,
  toCardinal,
  NWS_DEFAULT_COORDS
} from "./nwsClient.js";

const cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheFresh() {
  return cache.value && cache.expiresAt > Date.now();
}

function buildFallback(reason) {
  const updatedAt = new Date().toISOString();
  return {
    temperature: null,
    feelsLike: null,
    humidity: null,
    visibility: null,
    conditions: `Unavailable${reason ? `: ${reason}` : ""}`,
    updatedAt,
    stale: true
  };
}

export async function getWeatherConditions() {
  if (cacheFresh()) return cache.value;

  try {
    const obs = await getLatestObservation(NWS_DEFAULT_COORDS);
    const props = obs?.properties || {};
    const temperatureF = toFahrenheit(props.temperature?.value ?? null);
    const feelsLikeF = toFahrenheit(props.apparentTemperature?.value ?? props.temperature?.value ?? null);
    const humidity = props.relativeHumidity?.value ?? null;
    const visibilityMiles = metersToMiles(props.visibility?.value ?? null);
    const conditions = props.textDescription || props.cloudLayers?.[0]?.amount || "Unavailable";
    const updatedAt = props.timestamp || new Date().toISOString();

    const result = {
      temperature: temperatureF,
      feelsLike: feelsLikeF,
      humidity: humidity !== null ? Math.round(humidity) : null,
      visibility: visibilityMiles !== null ? Number(visibilityMiles.toFixed(1)) : null,
      conditions,
      updatedAt
    };

    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  } catch (err) {
    console.error(`NWS weather error: ${err.message}`);
    const fallback = buildFallback(err.message);
    cache.value = fallback;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return fallback;
  }
}

// Re-export helpers for wind service reuse
export { toCardinal };
