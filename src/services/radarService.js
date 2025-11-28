const RADAR_IMAGE_URL = "https://radar.weather.gov/ridge/lite/N0R/MOB_0.gif";

const cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheFresh() {
  return cache.value && cache.expiresAt > Date.now();
}

export async function getRadarSnapshot() {
  if (cacheFresh()) return cache.value;
  const updatedAt = new Date().toISOString();
  const result = { imageUrl: RADAR_IMAGE_URL, updatedAt };
  cache.value = result;
  cache.expiresAt = Date.now() + CACHE_TTL_MS;
  return result;
}
