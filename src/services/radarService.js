export async function getRadarSnapshot() {
  const now = new Date().toISOString();
  return {
    imageUrl: "https://example.com/radar.png",
    updatedAt: now
  };
}
