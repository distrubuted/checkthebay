import fs from "fs";
import path from "path";

const STATIONS_PATH = path.join(process.cwd(), "data", "stations.json");

export function stationsHandler(_req, res) {
  try {
    const raw = fs.readFileSync(STATIONS_PATH, "utf8");
    const stations = JSON.parse(raw);
    res.json({ ok: true, stations });
  } catch (err) {
    res.status(500).json({ ok: false, error: "stations_unavailable", detail: err.message });
  }
}
