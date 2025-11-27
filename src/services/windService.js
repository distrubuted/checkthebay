export async function getWindConditions() {
  const now = new Date().toISOString();
  return {
    speed: 8.4,
    gust: 12.1,
    directionDegrees: 245,
    directionCardinal: "WSW",
    updatedAt: now
  };
}
