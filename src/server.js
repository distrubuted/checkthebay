import http from "http";
import { handleConditionsSummary } from "./api/conditionsSummary.js";
import { handleConditionsStations } from "./api/conditionsStations.js";
import { handleConditionsFieldWind } from "./api/conditionsFieldWind.js";
import { handleConditionsTides } from "./api/conditionsTides.js";
import { runPollOnce } from "./pollers/pollConditions.js";

const PORT = process.env.PORT || 8787;
const ENABLE_POLL_ON_BOOT = process.env.POLL_ON_BOOT !== "false";
const BASE_PATH_RAW = process.env.BASE_PATH || "/api";
// Normalize the base path to always start with a leading slash and never end with one (except root).
const BASE_PATH = BASE_PATH_RAW === "/" ? "" : `/${BASE_PATH_RAW.replace(/^\/+/, "").replace(/\/+$/, "")}`;

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

function matchRoute(pathname) {
  // Support both the BASE_PATH-prefixed routes and (for backward compatibility) bare routes.
  const candidates = [pathname];
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    const stripped = pathname.slice(BASE_PATH.length) || "/";
    candidates.push(stripped);
  }
  for (const candidate of candidates) {
    if (routes[candidate]) {
      return routes[candidate];
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  const handler = matchRoute(path);
  if (handler) {
    return handler(req, res);
  }
  sendNotFound(res);
});

server.listen(PORT, () => {
  console.log(`Check The Bay backend listening on ${PORT} with base path ${BASE_PATH || "/"}`);
  if (ENABLE_POLL_ON_BOOT) {
    runPollOnce();
  }
});
