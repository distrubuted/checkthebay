import { ensureFetch } from "./fetch.js";

const BAY_LAT = 30.3;
const BAY_LON = -88.0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutes
const USER_AGENT = "CheckTheBay backend";

let cachedConditions = null;

function mphToKts(mph) {
  return mph * 0.868976;
}

function parseWindSpeedKts(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" && !Number.isNaN(raw)) {
    return Math.round(mphToKts(raw) * 10) / 10;
  }
  if (typeof raw !== "string") return null;
  const matches = raw.match(/([0-9]+(?:\.[0-9]+)?)/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map((n) => parseFloat(n)).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;
  const avgMph = nums.reduce((sum, n) => sum + n, 0) / nums.length;
  return Math.round(mphToKts(avgMph) * 10) / 10;
}

function cardinalToDegrees(cardinal) {
  if (!cardinal || typeof cardinal !== "string") return null;
  const map = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5
  };
  const upper = cardinal.trim().toUpperCase();
  return map[upper] ?? null;
}

function degreesToCardinal(deg) {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

function computeRating({ windSpeedKts, visibilityMi, airTempF, waterTempF }) {
  if (windSpeedKts !== null && windSpeedKts > 20) {
    return { rating: "bad", ratingReason: "Strong winds; rough bay expected." };
  }
  if ((airTempF === null || waterTempF === null) && windSpeedKts !== null && windSpeedKts >= 15) {
    return { rating: "bad", ratingReason: "Limited data and breezy conditions; exercise caution." };
  }
  if (windSpeedKts !== null && windSpeedKts >= 13) {
    return { rating: "caution", ratingReason: "Breezy; choppy water likely." };
  }
  if (visibilityMi !== null && visibilityMi < 3) {
    return { rating: "caution", ratingReason: "Reduced visibility on the bay." };
  }
  return { rating: "good", ratingReason: "Light winds; generally smooth conditions." };
}

async function fetchJson(url) {
  const fetch = await ensureFetch();
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/geo+json"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchWaterTemperatureF() {
  // Placeholder for a stable nearby bay station (e.g., NDBC or CO-OPS water temperature feed).
  // Replace this URL with a reliable JSON endpoint that returns the latest water temperature.
  // Returning null keeps the service robust when the external feed is unavailable or unspecified.
  return null;
}

async function fetchNwsPointData() {
  const pointUrl = `https://api.weather.gov/points/${BAY_LAT},${BAY_LON}`;
  const point = await fetchJson(pointUrl);
  const forecastUrl = point?.properties?.forecastHourly || point?.properties?.forecast;
  if (!forecastUrl) {
    throw new Error("forecast endpoint unavailable");
  }
  const forecast = await fetchJson(forecastUrl);
  const period = forecast?.properties?.periods?.[0];
  if (!period) {
    throw new Error("no forecast periods available");
  }
  const windSpeedKts = parseWindSpeedKts(period.windSpeed);
  const windGustKts = parseWindSpeedKts(period.windGust || null);
  const windDirDeg = typeof period.windDirection === "number" ? period.windDirection : cardinalToDegrees(period.windDirection);
  const windDirText = period.windDirection || degreesToCardinal(windDirDeg);
  const airTempF = typeof period.temperature === "number" ? period.temperature : null;
  const weatherSummary = period.shortForecast || null;
  // Visibility is not consistently present on the hourly forecast; return null when unavailable.
  const visibilityMi = null;
  return { windSpeedKts, windGustKts, windDirDeg, windDirText, airTempF, weatherSummary, visibilityMi };
}

export async function getCurrentConditions() {
  const now = Date.now();
  if (cachedConditions && cachedConditions.expiresAt > now) {
    return cachedConditions.data;
  }
  try {
    const [nws, waterTempF] = await Promise.all([
      fetchNwsPointData(),
      fetchWaterTemperatureF()
    ]);

    const base = {
      updatedAt: new Date().toISOString(),
      location: "Central Mobile Bay",
      windSpeedKts: nws.windSpeedKts,
      windGustKts: nws.windGustKts,
      windDirDeg: nws.windDirDeg,
      windDirText: nws.windDirText,
      airTempF: nws.airTempF,
      waterTempF,
      weatherSummary: nws.weatherSummary,
      visibilityMi: nws.visibilityMi
    };

    const { rating, ratingReason } = computeRating(base);
    const enriched = { ...base, rating, ratingReason };
    cachedConditions = { data: enriched, expiresAt: now + CACHE_MS };
    return enriched;
  } catch (err) {
    console.error(`Conditions fetch error: ${err.message}`);
    if (cachedConditions?.data) {
      return { ...cachedConditions.data, stale: true };
    }
    const fallbackBase = {
      updatedAt: new Date().toISOString(),
      location: "Central Mobile Bay",
      windSpeedKts: null,
      windGustKts: null,
      windDirDeg: null,
      windDirText: null,
      airTempF: null,
      waterTempF: null,
      weatherSummary: null,
      visibilityMi: null
    };
    const { rating, ratingReason } = computeRating(fallbackBase);
    return { ...fallbackBase, rating, ratingReason, stale: true };
  }
}
