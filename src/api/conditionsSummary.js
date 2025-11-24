import { loadSnapshot } from "../lib/snapshotStore.js";

export async function handleConditionsSummary(req, res) {
  const snapshot = await loadSnapshot();
  if (!snapshot || !snapshot.summary) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "snapshot_unavailable" }));
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({ ok: true, updatedAt: snapshot.updatedAt, summary: snapshot.summary })
  );
}
