import { fetchExtremesAndHeights, DEFAULT_TIDE_COORDS } from "../lib/worldTides.js";
import { normalizeTideSnapshot } from "../lib/normalize.js";

export async function tidesHandler(req, res) {
  const lat = parseFloat(req.query.lat) || DEFAULT_TIDE_COORDS.lat;
  const lon = parseFloat(req.query.lon) || DEFAULT_TIDE_COORDS.lon;
  try {
    const raw = await fetchExtremesAndHeights(lat, lon);
    const normalized = normalizeTideSnapshot(raw);
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ ok: false, error: "tides_fetch_failed", detail: err.message });
  }
}
