import fs from "fs/promises";
import path from "path";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "snapshot.json");

export async function saveSnapshot(snapshot) {
  try {
    await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
    await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to save snapshot", err);
    return false;
  }
}

export async function loadSnapshot() {
  try {
    const content = await fs.readFile(SNAPSHOT_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    }
    console.error("Failed to load snapshot", err);
    return null;
  }
}
