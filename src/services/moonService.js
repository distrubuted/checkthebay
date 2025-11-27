export async function getMoonPhase() {
  const now = new Date().toISOString();
  return {
    phase: "Waxing Gibbous",
    illumination: 78,
    moonrise: now,
    moonset: now,
    updatedAt: now
  };
}
