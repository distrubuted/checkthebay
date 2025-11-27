export async function getWeatherConditions() {
  const now = new Date().toISOString();
  return {
    temperature: 67,
    feelsLike: 66,
    humidity: 48,
    visibility: 9.2,
    conditions: "Sunny",
    updatedAt: now
  };
}
