import { fetchWithTimeout } from "./httpClient.js";

const BASE_URL = "https://api.weather.gov";
const USER_AGENT = "CheckTheBay (developer@example.com)";
const DEFAULT_TIMEOUT_MS = 12_000;

async function fetchJson(url) {
  try {
    const res = await fetchWithTimeout(url, {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json, application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`NWS request failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("noaaWeather: upstream fetch failed", err?.message || err);
    return null;
  }
}

function parseWindSpeed(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/([0-9.]+)\s*(mph|kt|kts)?/i);
  if (!match) return null;
  const speed = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "mph") {
    return speed * 0.868976; // convert mph to knots
  }
  return speed;
}

export async function getHourlyForecast(lat, lon) {
  const pointUrl = `${BASE_URL}/points/${lat},${lon}`;
  const point = await fetchJson(pointUrl);
  const hourlyUrl = point?.properties?.forecastHourly;
  if (!hourlyUrl) {
    return [];
  }
  const forecast = await fetchJson(hourlyUrl);
  const periods = Array.isArray(forecast.properties?.periods)
    ? forecast.properties.periods
    : [];
  return periods.map((period) => ({
    startTime: period.startTime,
    temperatureF: period.temperature,
    windSpeedKts: parseWindSpeed(period.windSpeed),
    windDirection: period.windDirection,
    shortForecast: period.shortForecast,
  }));
}
