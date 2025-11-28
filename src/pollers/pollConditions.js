import { pollTides } from "./pollTides.js";
import { getCurrentConditions } from "../lib/conditions.js";
import { loadSnapshot, saveSnapshot } from "../lib/snapshotStore.js";

export async function pollConditions() {
  const tides = await pollTides();
  const conditions = await getCurrentConditions();
  const now = new Date().toISOString();
  const snapshot = {
    updatedAt: now,
    tides,
    conditions
  };
  const existing = await loadSnapshot();
  await saveSnapshot({ ...existing, ...snapshot });
  return snapshot;
}
