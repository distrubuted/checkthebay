import http from "http";
import { handleConditionsSummary } from "./api/conditionsSummary.js";
import { handleConditionsStations } from "./api/conditionsStations.js";
import { handleConditionsFieldWind } from "./api/conditionsFieldWind.js";
import { handleConditionsTides } from "./api/conditionsTides.js";
import { runPollOnce } from "./pollers/pollConditions.js";

const PORT = process.env.PORT || 8787;
const ENABLE_POLL_ON_BOOT = process.env.POLL_ON_BOOT !== "false";

function sendNotFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
}

function withCors(handler) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    await handler(req, res);
  };
}

const routes = {
  "/conditions/summary": withCors(handleConditionsSummary),
  "/conditions/stations": withCors(handleConditionsStations),
  "/conditions/field/wind": withCors(handleConditionsFieldWind),
  "/conditions/tides": withCors(handleConditionsTides),
};

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  const handler = routes[path];
  if (handler) {
    return handler(req, res);
  }
  sendNotFound(res);
});

server.listen(PORT, () => {
  console.log(`Check The Bay backend listening on ${PORT}`);
  if (ENABLE_POLL_ON_BOOT) {
    runPollOnce();
  }
});
