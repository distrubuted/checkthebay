export async function scrapeWeather() {
  return {
    weather: {
      tempF: null,
      feelsLikeF: null,
      humidityPct: null,
      visibilityMi: null,
      summary: null,
    },
    errors: [],
  };
}
