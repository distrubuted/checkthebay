function findNext(extremes, type, nowSeconds) {
  const sorted = [...extremes].filter((e) => e.type && e.height !== undefined);
  sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  return sorted.find((e) => e.type.toLowerCase().includes(type) && (e.timestamp || 0) > nowSeconds) || null;
}

function currentHeightFromSeries(series, nowSeconds) {
  if (!Array.isArray(series) || series.length === 0) return null;
  let closest = series[0];
  let minDiff = Math.abs((series[0].dt || 0) - nowSeconds);
  for (const point of series) {
    const diff = Math.abs((point.dt || 0) - nowSeconds);
    if (diff < minDiff) {
      closest = point;
      minDiff = diff;
    }
  }
  return closest.height ?? null;
}

export function normalizeTideSnapshot(raw) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const extremes = (raw.extremes || []).map((e) => ({
    type: e.type,
    height: e.height,
    timestamp: e.timestamp || e.dt || null
  }));
  const hourly = (raw.heights || raw.hourly || []).map((h) => ({
    dt: h.dt || h.timestamp || null,
    height: h.height
  }));

  const nextHigh = findNext(extremes, "high", nowSeconds);
  const nextLow = findNext(extremes, "low", nowSeconds);

  return {
    updatedAt: raw.updatedAt || new Date().toISOString(),
    station: raw.station,
    currentHeight: currentHeightFromSeries(hourly, nowSeconds),
    nextHigh,
    nextLow,
    extremes,
    hourly
  };
}
