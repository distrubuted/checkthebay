export async function scrapeWind() {
  return {
    wind: {
      speedMph: null,
      gustMph: null,
      directionDeg: null,
      directionCardinal: null,
    },
    errors: [],
  };
}
