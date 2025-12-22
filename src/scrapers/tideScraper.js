export async function scrapeTide() {
  return {
    tide: {
      currentFt: null,
      nextHigh: null,
      nextLow: null,
      trend: null,
    },
    errors: [],
  };
}
