import express from "express";
import cors from "cors";
import { tidesHandler } from "./api/tides.js";
import { conditionsHandler } from "./api/conditions.js";
import { stationsHandler } from "./api/stations.js";
import { inshoreReefsHandler } from "./api/reefs.js";
import { pollConditions } from "./pollers/pollConditions.js";
import { getAggregatedConditions } from "./services/conditionsAggregator.js";

const app = express();
const apiRouter = express.Router();
const PORT = process.env.PORT || 8787;
const BASE_PATH = "/api";
const TEN_MINUTES = 10 * 60 * 1000;

app.use(cors());
app.use(express.json());

// Existing routes
apiRouter.get("/tides", tidesHandler);
apiRouter.get("/conditions", conditionsHandler);
apiRouter.get("/conditions/tides", tidesHandler);
apiRouter.get("/stations", stationsHandler);
apiRouter.get("/refs/inshore", inshoreReefsHandler);

// NEW unified conditions endpoint using the aggregator
apiRouter.get("/full-conditions", async (_req, res) => {
  try {
    const payload = await getAggregatedConditions();
    res.json(payload);
  } catch (err) {
    console.error("full-conditions error:", err.message);
    res.status(500).json({
      ok: false,
      error: "full_conditions_failed",
      detail: err.message
    });
  }
});

app.use(BASE_PATH, apiRouter);

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "CheckTheBay backend",
    routes: [
      `${BASE_PATH}/tides`,
      `${BASE_PATH}/conditions`,
      `${BASE_PATH}/conditions/tides`,
      `${BASE_PATH}/stations`,
      `${BASE_PATH}/refs/inshore`,
      `${BASE_PATH}/full-conditions`
    ]
  });
});

function startPolling() {
  pollConditions().catch((err) =>
    console.error("Initial poll failed", err)
  );
  setInterval(() => {
    pollConditions().catch((err) =>
      console.error("Poll failed", err)
    );
  }, TEN_MINUTES);
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}${BASE_PATH}`);
  startPolling();
});
