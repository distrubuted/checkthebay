import { getLatestObservation, toMph, toCardinal, NWS_DEFAULT_COORDS } from "./nwsClient.js";

const cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheFresh() {
  return cache.value && cache.expiresAt > Date.now();
}

function fallback(reason) {
  const updatedAt = new Date().toISOString();
  return {
    speed: null,
    gust: null,
    directionDegrees: null,
    directionCardinal: null,
    updatedAt,
    stale: true,
    note: `Unavailable${reason ? `: ${reason}` : ""}`
  };
}

export async function getWindConditions() {
  if (cacheFresh()) return cache.value;
  try {
    const obs = await getLatestObservation(NWS_DEFAULT_COORDS);
    const props = obs?.properties || {};
    const speedMps = props.windSpeed?.value ?? null;
    const gustMps = props.windGust?.value ?? null;
    const direction = props.windDirection?.value ?? null;

    const speed = speedMps !== null ? Number(toMph(speedMps).toFixed(1)) : null;
    const gust = gustMps !== null ? Number(toMph(gustMps).toFixed(1)) : null;
    const directionDegrees = direction !== null ? Math.round(direction) : null;
    const directionCardinal = directionDegrees !== null ? toCardinal(directionDegrees) : null;
    const updatedAt = props.timestamp || new Date().toISOString();

    const result = { speed, gust, directionDegrees, directionCardinal, updatedAt };
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  } catch (err) {
    console.error(`NWS wind error: ${err.message}`);
    const result = fallback(err.message);
    cache.value = result;
    cache.expiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  }
}
