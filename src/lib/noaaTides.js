const BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const USER_AGENT = "CheckTheBay (developer@example.com)";
const DEFAULT_TIMEOUT_MS = 12_000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`NOAA request failed: ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
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

export async function getTidePredictions(stationId, options = {}) {
  const now = new Date();
  const rangeHours = options.rangeHours ?? 48;
  const params = new URLSearchParams({
    product: "predictions",
    interval: "hilo",
    application: "checkthebay",
    station: stationId,
    time_zone: "gmt",
    format: "json",
    units: "english",
    datum: "MLLW",
    range: String(rangeHours),
  });
  if (options.start && options.end) {
    params.delete("range");
    params.set("begin_date", options.start);
    params.set("end_date", options.end);
  }
  const url = `${BASE_URL}?${params.toString()}`;
  const data = await fetchJson(url);
  const predictions = Array.isArray(data.predictions) ? data.predictions : [];
  return predictions.map((p) => ({
    time: p.t,
    heightFt: p.v != null ? Number(p.v) : null,
  }));
}
