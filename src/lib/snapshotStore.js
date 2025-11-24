import fs from "fs";
import path from "path";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "snapshot.json");
let inMemorySnapshot = null;

export async function loadSnapshot() {
  if (inMemorySnapshot) return inMemorySnapshot;
  try {
    const raw = await fs.promises.readFile(SNAPSHOT_PATH, "utf8");
    inMemorySnapshot = JSON.parse(raw);
    return inMemorySnapshot;
  } catch (err) {
    return null;
  }
}

export async function saveSnapshot(snapshot) {
  inMemorySnapshot = snapshot;
  try {
    await fs.promises.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist snapshot", err.message);
  }
}

export function getSnapshotPath() {
  return SNAPSHOT_PATH;
}
