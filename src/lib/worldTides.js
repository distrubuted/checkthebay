import fs from "fs";
import { ensureFetch } from "./fetch.js";

const API_BASE = "https://www.worldtides.info/api/v3";
const CACHE_WINDOW_MS = 6 * 60 * 1000; // 6 minutes
const FALLBACK_LOCATION = {
  lat: 30.49,
  lon: -87.93,
  station: "Point Clear, AL"
};

let cache = {};

function cacheKey(lat, lon) {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function loadLocalSample() {
  try {
    const samplePath = new URL("../../data/sampleWorldTides.json", import.meta.url);
    if (fs.existsSync(samplePath)) {
      const raw = fs.readFileSync(samplePath, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("WorldTides error: failed to read sample", err.message);
  }
  return {
    station: FALLBACK_LOCATION.station,
    timestamp: Date.now(),
    extremes: [
      { dt: Date.now() / 1000 - 18000, height: 1.4, type: "Low" },
      { dt: Date.now() / 1000 - 7200, height: 2.1, type: "High" },
      { dt: Date.now() / 1000 + 7200, height: 1.2, type: "Low" },
      { dt: Date.now() / 1000 + 18000, height: 2.4, type: "High" }
    ],
    heights: Array.from({ length: 24 }, (_, idx) => {
      const dt = Math.floor(Date.now() / 1000) - 3600 * (12 - idx);
      const height = 1.5 + Math.sin(idx / 3) * 0.4;
      return { dt, height };
    })
  };
}

function normalizeResponse(data, lat, lon) {
  return {
    station: data.station || `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
    extremes: (data.extremes || []).map((item) => ({
      type: item.type,
      height: item.height,
      timestamp: item.dt || item.datetime || item.timestamp
    })),
    heights: (data.heights || []).map((item) => ({
      dt: item.dt || item.t,
      height: item.height
    })),
    updatedAt: new Date().toISOString()
  };
}

export async function fetchExtremesAndHeights(lat, lon) {
  const key = cacheKey(lat, lon);
  const now = Date.now();
  const cached = cache[key];
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const apiKey = process.env.WORLD_TIDES_API_KEY;
  if (!apiKey) {
    const sample = normalizeResponse(loadLocalSample(), lat, lon);
    cache[key] = { data: sample, expiresAt: now + CACHE_WINDOW_MS };
    return sample;
  }

  const params = new URLSearchParams({
    key: apiKey,
    lat: String(lat),
    lon: String(lon),
    extremes: "1",
    heights: "1",
    step: "3600",
    length: String(48 * 3600)
  });

  const url = `${API_BASE}?${params.toString()}`;

  try {
    const fetch = await ensureFetch();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CheckTheBay backend"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const json = await response.json();
    const normalized = normalizeResponse(json, lat, lon);
    cache[key] = { data: normalized, expiresAt: now + CACHE_WINDOW_MS };
    return normalized;
  } catch (err) {
    console.error(`WorldTides error: ${err.message}`);
    if (cached) {
      return cached.data;
    }
    const sample = normalizeResponse(loadLocalSample(), lat, lon);
    cache[key] = { data: sample, expiresAt: now + CACHE_WINDOW_MS };
    return sample;
  }
}

export const DEFAULT_TIDE_COORDS = FALLBACK_LOCATION;
