import express from "express";
import cors from "cors";
import { tidesHandler } from "./api/tides.js";
import { conditionsHandler } from "./api/conditions.js";
import { stationsHandler } from "./api/stations.js";
import { inshoreReefsHandler } from "./api/reefs.js";
import { pollConditions } from "./pollers/pollConditions.js";

const app = express();
const apiRouter = express.Router();
const PORT = process.env.PORT || 8787;
const BASE_PATH = "/api";
const TEN_MINUTES = 10 * 60 * 1000;

app.use(cors());
app.use(express.json());

apiRouter.get("/tides", tidesHandler);
apiRouter.get("/conditions/tides", tidesHandler);
apiRouter.get("/conditions", conditionsHandler);
apiRouter.get("/stations", stationsHandler);
apiRouter.get("/reefs/inshore", inshoreReefsHandler);

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
      `${BASE_PATH}/reefs/inshore`
    ]
  });
});

function startPolling() {
  pollConditions().catch((err) => console.error("Initial poll failed", err));
  setInterval(() => {
    pollConditions().catch((err) => console.error("Poll failed", err));
  }, TEN_MINUTES);
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}${BASE_PATH}`);
  startPolling();
});
