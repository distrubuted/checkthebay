import { fetchExtremesAndHeights, DEFAULT_TIDE_COORDS } from "../lib/worldTides.js";
import { normalizeTideSnapshot } from "../lib/normalize.js";
import { getWeatherConditions } from "./weatherService.js";
import { getWindConditions } from "./windService.js";
import { getMarineForecast } from "./marineService.js";
import { getMoonPhase } from "./moonService.js";
import { getRadarSnapshot } from "./radarService.js";

async function fetchTides() {
  try {
    const raw = await fetchExtremesAndHeights(DEFAULT_TIDE_COORDS.lat, DEFAULT_TIDE_COORDS.lon);
    return normalizeTideSnapshot(raw);
  } catch (err) {
    console.error(`Tide fetch failed in aggregator: ${err.message}`);
    return { error: err.message };
  }
}

export async function getAggregatedConditions() {
  const [tides, weather, wind, marine, moon, radar] = await Promise.all([
    fetchTides(),
    getWeatherConditions(),
    getWindConditions(),
    getMarineForecast(),
    getMoonPhase(),
    getRadarSnapshot()
  ]);

  return {
    updatedAt: new Date().toISOString(),
    tides,
    weather,
    wind,
    marine,
    moon,
    radar
  };
}
