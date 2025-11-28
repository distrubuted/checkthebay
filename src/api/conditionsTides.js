import { getTidePredictions } from "../lib/noaaTides.js";
import { loadSnapshot } from "../lib/snapshotStore.js";

export async function handleConditionsTides(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const stationId = url.searchParams.get("station");
  if (!stationId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "station_required" }));
    return;
  }

  // Try cache first
  const snapshot = await loadSnapshot();
  const cached = snapshot?.predictionsByStation?.[stationId];
  if (cached) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, stationId, predictions: cached }));
    return;
  }

  try {
    const predictions = await getTidePredictions(stationId, { rangeHours: 72 });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, stationId, predictions }));
  } catch (err) {
    console.error("Failed to fetch tide predictions", err);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "upstream_error" }));
  }
}
