import { getAggregatedConditions } from "../services/conditionsAggregator.js";

export async function conditionsHandler(_req, res) {
  try {
    const payload = await getAggregatedConditions();
    res.json(payload);
  } catch (err) {
    console.error(`Conditions handler error: ${err.message}`);
    res
      .status(500)
      .json({ ok: false, error: "conditions_fetch_failed", detail: err.message });
  }
}
