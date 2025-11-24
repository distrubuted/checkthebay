import { STATIONS, PRIMARY_STATION_ID } from "../config/stations.js";
import { getStationWaterLevel, getTidePredictions } from "../lib/noaaTides.js";
import { getHourlyForecast } from "../lib/noaaWeather.js";
import { getWindField } from "../lib/gcoosField.js";
import {
  buildStationConditions,
  buildSummary,
  computeTidePhaseFromSeries,
} from "../lib/normalize.js";
import { saveSnapshot } from "../lib/snapshotStore.js";
import { publishConditionsUpdate } from "../lib/pubsub.js";

const POLL_INTERVAL_MINUTES = Number(process.env.POLL_MINUTES || 10);

async function pollStation(stationConfig) {
  try {
    const [water, forecast, tidePredictions] = await Promise.all([
      getStationWaterLevel(stationConfig.noaaStationId),
      getHourlyForecast(stationConfig.lat, stationConfig.lon),
      getTidePredictions(stationConfig.noaaStationId, { rangeHours: 6 }),
    ]);
    const tidePhase = computeTidePhaseFromSeries(tidePredictions);
    const stationConditions = buildStationConditions(
      stationConfig,
      water,
      forecast,
      tidePhase
    );
    return { stationConditions, tidePredictions };
  } catch (err) {
    console.error(`Failed to poll station ${stationConfig.id}`, err);
    return { stationConditions: buildStationConditions(stationConfig), tidePredictions: [] };
  }
}

export async function runPollOnce() {
  const stationEntries = Object.values(STATIONS);
  const results = await Promise.all(stationEntries.map((station) => pollStation(station)));

  const stations = results.map((r) => r.stationConditions);
  const predictionsByStation = stationEntries.reduce((acc, station, idx) => {
    acc[station.id] = results[idx].tidePredictions;
    return acc;
  }, {});

  const primary = stations.find((s) => s.stationId === PRIMARY_STATION_ID) || stations[0];
  const summary = primary ? buildSummary(primary) : null;
  let fieldWind = null;
  try {
    fieldWind = await getWindField();
  } catch (err) {
    console.error("Failed to fetch wind field", err);
    fieldWind = null;
  }

  const snapshot = {
    updatedAt: new Date().toISOString(),
    summary,
    stations,
    predictionsByStation,
    field: {
      wind: fieldWind,
    },
  };

  await saveSnapshot(snapshot);
  await publishConditionsUpdate(snapshot);
  console.log("pollConditions", {
    at: snapshot.updatedAt,
    stations: stations.length,
    windField: fieldWind?.vectors?.length ?? 0,
  });
  return snapshot;
}

function schedule() {
  const intervalMs = POLL_INTERVAL_MINUTES * 60 * 1000;
  runPollOnce();
  setInterval(runPollOnce, intervalMs);
  console.log(`Polling scheduled every ${POLL_INTERVAL_MINUTES} minutes`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  schedule();
}
