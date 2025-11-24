import { fetchExtremesAndHeights } from "../lib/worldTides.js";

const DEFAULT_LAT = 30.49;
const DEFAULT_LON = -87.93;

export async function handleConditionsTides(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const lat = url.searchParams.has("lat")
    ? Number.parseFloat(url.searchParams.get("lat"))
    : DEFAULT_LAT;
  const lon = url.searchParams.has("lon")
    ? Number.parseFloat(url.searchParams.get("lon"))
    : DEFAULT_LON;

  try {
    const data = await fetchExtremesAndHeights(lat, lon);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(`WorldTides error: ${err?.message || err}`);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "tides_unavailable" }));
  }
}
