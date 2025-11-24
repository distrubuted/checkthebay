// This module fetches a wind vector field from the GCOOS ERDDAP service.
// Dataset reference (documented for easy swapping later):
// - Example dataset: NCEP GFS surface wind, aggregated by GCOOS
//   Endpoint: https://erddap.gcoos.org/erddap/griddap/gfs_pgrb2_global_0p25deg.csv
// Bounding box chosen to cover Mobile Bay and nearby Gulf waters.

import { fetchWithTimeout } from "./httpClient.js";

const ERDDAP_BASE = "https://erddap.gcoos.org/erddap/griddap/gfs_pgrb2_global_0p25deg.csv";
const DEFAULT_BOUNDS = {
  minLat: 28.0,
  maxLat: 31.5,
  minLon: -89.5,
  maxLon: -86.5,
};
const DEFAULT_TIMEOUT_MS = 15_000;

async function fetchCsv(url) {
  try {
    const res = await fetchWithTimeout(url, { timeoutMs: DEFAULT_TIMEOUT_MS });
    if (!res.ok) {
      throw new Error(`GCOOS request failed: ${res.status}`);
    }
    return await res.text();
  } catch (err) {
    console.warn("gcoosField: upstream fetch failed", err?.message || err);
    return null;
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  // first line is header with lat, lon, u-component_of_wind_height_above_ground, v-component_of_wind_height_above_ground
  const records = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [time, lat, lon, u, v] = lines[i].split(",");
    records.push({
      lat: Number(lat),
      lon: Number(lon),
      u: Number(u),
      v: Number(v),
    });
  }
  return records;
}

export async function getWindField(bounds = DEFAULT_BOUNDS) {
  // Query the most recent timestep (last()) for u and v components.
  const query = `${ERDDAP_BASE}?time,latitude,longitude,u-component_of_wind_height_above_ground,v-component_of_wind_height_above_ground&time=(last())&latitude=(${bounds.maxLat}):(${bounds.minLat}):0.25&longitude=(${bounds.minLon}):(${bounds.maxLon}):0.25`;
  const csv = await fetchCsv(query);
  if (!csv) {
    return null;
  }
  const vectors = parseCsv(csv);
  return {
    meta: {
      latStep: 0.25,
      lonStep: 0.25,
      description: "GFS surface wind field via GCOOS ERDDAP",
    },
    vectors,
  };
}
