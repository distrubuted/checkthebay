import { getCurrentConditions } from "../lib/conditions.js";

export async function conditionsHandler(_req, res) {
  try {
    const conditions = await getCurrentConditions();
    res.json(conditions);
  } catch (err) {
    console.error(`Conditions handler error: ${err.message}`);
    res
      .status(500)
      .json({ ok: false, error: "conditions_fetch_failed", detail: err.message });
  }
}
