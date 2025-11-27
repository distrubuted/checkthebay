import { DEFAULT_TIDE_COORDS, fetchExtremesAndHeights } from "../lib/worldTides.js";
import { normalizeTideSnapshot } from "../lib/normalize.js";
import { saveSnapshot, loadSnapshot } from "../lib/snapshotStore.js";

export async function pollTides(lat = DEFAULT_TIDE_COORDS.lat, lon = DEFAULT_TIDE_COORDS.lon) {
  const raw = await fetchExtremesAndHeights(lat, lon);
  const normalized = normalizeTideSnapshot(raw);
  const existing = (await loadSnapshot()) || {};
  const snapshot = {
    ...existing,
    updatedAt: new Date().toISOString(),
    tides: normalized
  };
  await saveSnapshot(snapshot);
  return normalized;
}
