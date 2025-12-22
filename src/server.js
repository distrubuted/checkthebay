import express from 'express';
import cors from 'cors';
import { getCurrentConditions, startPolling, initializeConditions } from './polling/poll.js';

const PORT = process.env.PORT || 8787;

const app = express();
app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/conditions', async (_req, res) => {
  await initializeConditions();
  res.json(getCurrentConditions());
});

async function bootstrap() {
  await initializeConditions();
  await startPolling();

  app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('[server] Failed to start server', error);
  process.exit(1);
});
