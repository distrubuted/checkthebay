export async function getMarineForecast() {
  const now = new Date().toISOString();
  return {
    summary: "Light chop with winds SW 5–10 kt",
    waveHeight: "1 ft or less",
    updatedAt: now
  };
}
