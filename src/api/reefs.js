import fs from "fs";
import path from "path";

const INSHORE_PATH = path.join(process.cwd(), "data", "reefs-inshore.json");

export function inshoreReefsHandler(_req, res) {
  try {
    const raw = fs.readFileSync(INSHORE_PATH, "utf8");
    const reefs = JSON.parse(raw);
    res.json({ ok: true, reefs });
  } catch (err) {
    res.status(500).json({ ok: false, error: "reefs_unavailable", detail: err.message });
  }
}
