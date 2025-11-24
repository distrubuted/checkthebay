import { fetchWithTimeout } from "./httpClient.js";

const BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const USER_AGENT = "CheckTheBay (developer@example.com)";
const DEFAULT_TIMEOUT_MS = 12_000;

async function fetchJson(url) {
  try {
    const res = await fetchWithTimeout(url, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
      throw new Error(`NOAA request failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("noaaTides: upstream fetch failed", err?.message || err);
    return null;
  }
}

export async function getStationWaterLevel(stationId) {
  const params = new URLSearchParams({
    product: "water_level",
    application: "checkthebay",
    station: stationId,
    time_zone: "gmt",
    datum: "MLLW",
    format: "json",
    units: "english",
    interval: "6",
    date: "latest",
  });
  const url = `${BASE_URL}?${params.toString()}`;
  const data = await fetchJson(url);
  if (!data) {
    return {
      stationId,
      time: null,
      waterLevelFt: null,
      sigma: null,
      flags: null,
      quality: null,
    };
  }
  const observation = Array.isArray(data.data) ? data.data[0] : null;
  if (!observation) {
    return {
      stationId,
      time: null,
      waterLevelFt: null,
      sigma: null,
      flags: null,
      quality: null,
    };
  }
  return {
    stationId,
    time: observation.t || null,
    waterLevelFt: observation.v != null ? Number(observation.v) : null,
    sigma: observation.s != null ? Number(observation.s) : null,
    flags: observation.f || null,
    quality: observation.q || null,
  };
}
