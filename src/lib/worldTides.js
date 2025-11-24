import { fetchWithTimeout } from "./httpClient.js";

const BASE_URL = "https://www.worldtides.info/api/v3";
const CACHE_TTL_MS = 6 * 60 * 1000; // 6 minutes
const DEFAULT_LOCATION = { lat: 30.49, lon: -87.93, name: "Point Clear, AL" };
const DEFAULT_TIMEOUT_MS = 12_000;

// Simple in-memory cache scoped to a single location.
let lastCache = null;

const SAMPLE_RESPONSE = {
  station: DEFAULT_LOCATION.name,
  extremes: [
    { type: "High", height: 1.93, timestamp: 1732408200 },
    { type: "Low", height: -0.1, timestamp: 1732430100 },
  ],
  heights: [
    { dt: 1732378200, height: 0.54 },
    { dt: 1732378500, height: 0.57 },
  ],
};

function isCacheValid(lat, lon) {
  if (!lastCache) return false;
  const fresh = Date.now() - lastCache.fetchedAt < CACHE_TTL_MS;
  const sameLocation =
    Math.abs(lastCache.lat - lat) < 0.0001 && Math.abs(lastCache.lon - lon) < 0.0001;
  return fresh && sameLocation;
}

function buildUrl(lat, lon, apiKey) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    key: apiKey,
    extremes: "",
    heights: "",
    step: "3600", // hourly heights
    days: "3", // request roughly 72 hours of data
  });
  return `${BASE_URL}?${params.toString()}`;
}

function normalizeResponse(raw, lat, lon) {
  const stationName = raw?.station || DEFAULT_LOCATION.name;
  const extremes = Array.isArray(raw?.extremes)
    ? raw.extremes.map((e) => ({
        type: e.type || e.state || "Unknown",
        height: e.height != null ? Number(e.height) : null,
        timestamp: e.dt != null ? Number(e.dt) : null,
      }))
    : [];

  const heights = Array.isArray(raw?.heights)
    ? raw.heights.map((h) => ({
        dt: h.dt != null ? Number(h.dt) : null,
        height: h.height != null ? Number(h.height) : null,
      }))
    : [];

  return {
    station: stationName,
    lat,
    lon,
    extremes,
    heights,
    updatedAt: new Date().toISOString(),
  };
}

function buildDefault(lat, lon) {
  return {
    ...SAMPLE_RESPONSE,
    lat,
    lon,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchExtremesAndHeights(rawLat, rawLon) {
  const lat = Number.isFinite(rawLat) ? rawLat : DEFAULT_LOCATION.lat;
  const lon = Number.isFinite(rawLon) ? rawLon : DEFAULT_LOCATION.lon;

  if (isCacheValid(lat, lon)) {
    return lastCache.data;
  }

  const apiKey = process.env.WORLD_TIDES_API_KEY;

  if (!apiKey) {
    const data = buildDefault(lat, lon);
    lastCache = { lat, lon, data, fetchedAt: Date.now() };
    return data;
  }

  const url = buildUrl(lat, lon, apiKey);
  try {
    const res = await fetchWithTimeout(url, { timeoutMs: DEFAULT_TIMEOUT_MS });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const json = await res.json();
    const normalized = normalizeResponse(json, lat, lon);
    lastCache = { lat, lon, data: normalized, fetchedAt: Date.now() };
    return normalized;
  } catch (err) {
    console.error(`WorldTides error: ${err?.message || err}`);
    if (isCacheValid(lat, lon)) {
      return lastCache.data;
    }
    throw err;
  }
}
