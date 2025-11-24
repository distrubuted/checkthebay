import { loadSnapshot } from "../lib/snapshotStore.js";

export async function conditionsHandler(_req, res) {
  const snapshot = await loadSnapshot();
  if (!snapshot) {
    return res.status(503).json({ ok: false, error: "snapshot_unavailable" });
  }
  res.json(snapshot);
}
