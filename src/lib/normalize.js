/**
 * StationConditions = {
 *   stationId: string,
 *   name: string,
 *   lat: number,
 *   lon: number,
 *   windSpeedKts: number | null,
 *   windGustKts: number | null,
 *   windDirDeg: number | null,
 *   airTempF: number | null,
 *   waterTempF: number | null,
 *   waterLevelFt: number | null,
 *   tidePhase: "rising" | "falling" | "slack" | null,
 *   source: "NOAA" | "ARCOS" | "GCOOS",
 *   observedAt: string | null,
 * }
 *
 * ConditionsSummary = {
 *   rating: "good" | "caution" | "bad",
 *   message: string,
 *   stationId: string,
 *   stationName: string,
 *   area: string,
 *   windSpeedKts: number | null,
 *   windDirDeg: number | null,
 *   waveHeightFt: number | null | undefined,
 *   tidePhase: "rising" | "falling" | "slack" | null,
 *   updatedAt: string,
 * }
 */

export function computeTidePhaseFromSeries(predictions = [], now = new Date()) {
  if (!predictions.length) return null;
  const times = predictions
    .map((p) => ({ ...p, date: new Date(p.time) }))
    .filter((p) => !Number.isNaN(p.date.getTime()))
    .sort((a, b) => a.date - b.date);
  const current = times.find((p) => p.date > now) || times[times.length - 1];
  const previousIndex = Math.max(0, times.indexOf(current) - 1);
  const previous = times[previousIndex];
  if (!current || !previous) return null;
  const delta = current.heightFt - previous.heightFt;
  if (Math.abs(delta) < 0.05) return "slack";
  return delta > 0 ? "rising" : "falling";
}

export function computeRating(conditions) {
  const wind = conditions.windSpeedKts ?? 0;
  const waterLevel = conditions.waterLevelFt;
  if (wind > 20 || (waterLevel != null && Math.abs(waterLevel) > 2)) {
    return "bad";
  }
  if (wind > 12 || (waterLevel != null && Math.abs(waterLevel) > 1.5)) {
    return "caution";
  }
  return "good";
}

export function summarizeConditions(conditions, rating) {
  const wind = conditions.windSpeedKts;
  const tide = conditions.tidePhase;
  const pieces = [];
  if (wind != null) {
    pieces.push(`Winds ${wind.toFixed(0)} kt`);
  } else {
    pieces.push("Winds n/a");
  }
  if (tide) {
    pieces.push(`${tide} tide`);
  }
  const status = rating === "good" ? "Good" : rating === "caution" ? "Caution" : "Rough";
  return `${status} conditions. ${pieces.join(", ")}.`.trim();
}

export function buildStationConditions(stationConfig, water, forecast, tidePhase) {
  const firstHour = Array.isArray(forecast) ? forecast[0] : null;
  return {
    stationId: stationConfig.id,
    name: stationConfig.name,
    lat: stationConfig.lat,
    lon: stationConfig.lon,
    windSpeedKts: firstHour?.windSpeedKts ?? null,
    windGustKts: null,
    windDirDeg: firstHour?.windDirection ?? null,
    airTempF: firstHour?.temperatureF ?? null,
    waterTempF: null,
    waterLevelFt: water?.waterLevelFt ?? null,
    tidePhase: tidePhase ?? null,
    source: "NOAA",
    observedAt: water?.time || firstHour?.startTime || null,
  };
}

export function buildSummary(stationConditions) {
  const rating = computeRating(stationConditions);
  return {
    rating,
    message: summarizeConditions(stationConditions, rating),
    stationId: stationConditions.stationId,
    stationName: stationConditions.name,
    area: "Mobile Bay",
    windSpeedKts: stationConditions.windSpeedKts,
    windDirDeg: stationConditions.windDirDeg,
    waveHeightFt: null,
    tidePhase: stationConditions.tidePhase,
    updatedAt: new Date().toISOString(),
  };
}
