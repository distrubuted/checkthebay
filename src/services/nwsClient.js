import { ensureFetch } from "../lib/fetch.js";

const DEFAULT_COORDS = { lat: 30.3, lon: -88.0 };
const USER_AGENT = "CheckTheBay/1.0 (backend@checkthebay.example)";

const metadataCache = { value: null, expiresAt: 0 };
const observationCache = { value: null, expiresAt: 0 };
const forecastCache = { value: null, expiresAt: 0 };

function nowMs() {
  return Date.now();
}

function cacheFresh(cache) {
  return cache.value && cache.expiresAt > nowMs();
}

async function fetchJson(url) {
  const fetch = await ensureFetch();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json,application/json"
      },
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPointsMetadata(coords = DEFAULT_COORDS) {
  if (cacheFresh(metadataCache)) return metadataCache.value;
  const url = `https://api.weather.gov/points/${coords.lat},${coords.lon}`;
  const data = await fetchJson(url);
  const { forecast, forecastHourly, observationStations, forecastGridData } = data.properties || {};
  const meta = { forecast, forecastHourly, observationStations, forecastGridData };
  metadataCache.value = meta;
  metadataCache.expiresAt = nowMs() + 10 * 60 * 1000;
  return meta;
}

export async function getLatestObservation(coords = DEFAULT_COORDS) {
  if (cacheFresh(observationCache)) return observationCache.value;
  const meta = await getPointsMetadata(coords);
  if (!meta.observationStations) throw new Error("observationStations not available");
  const stationList = await fetchJson(meta.observationStations);
  const station = stationList.features?.[0]?.id;
  if (!station) throw new Error("No observation station found");
  const obs = await fetchJson(`${station}/observations/latest`);
  observationCache.value = obs;
  observationCache.expiresAt = nowMs() + 5 * 60 * 1000;
  return obs;
}

export async function getForecast(coords = DEFAULT_COORDS) {
  if (cacheFresh(forecastCache)) return forecastCache.value;
  const meta = await getPointsMetadata(coords);
  if (!meta.forecast) throw new Error("forecast endpoint not available");
  const fc = await fetchJson(meta.forecast);
  forecastCache.value = fc;
  forecastCache.expiresAt = nowMs() + 5 * 60 * 1000;
  return fc;
}

export function toFahrenheit(valueC) {
  if (valueC === null || valueC === undefined) return null;
  return valueC * 9 / 5 + 32;
}

export function toMph(valueMps) {
  if (valueMps === null || valueMps === undefined) return null;
  return valueMps * 2.23694;
}

export function metersToMiles(meters) {
  if (meters === null || meters === undefined) return null;
  return meters * 0.000621371;
}

export function toCardinal(deg) {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[idx];
}

export const NWS_DEFAULT_COORDS = DEFAULT_COORDS;
