// Placeholder hook for future pub/sub integration.
// In production this could publish to Redis channels, Ably, Pusher, etc.
// to push alerts when ratings change.
export async function publishConditionsUpdate(snapshot) {
  console.log("publishConditionsUpdate", {
    updatedAt: snapshot?.updatedAt,
    stations: snapshot?.stations?.length,
  });
}
