import { pollTides } from "./pollTides.js";
import { loadSnapshot, saveSnapshot } from "../lib/snapshotStore.js";

export async function pollConditions() {
  const tides = await pollTides();
  const now = new Date().toISOString();
  const snapshot = {
    updatedAt: now,
    tides,
    conditions: {
      message: "Weather polling disabled; tides updated from WorldTides.",
      updatedAt: now
    }
  };
  const existing = await loadSnapshot();
  await saveSnapshot({ ...existing, ...snapshot });
  return snapshot;
}
