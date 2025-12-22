export function textOrNull(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

export function numberOrNull(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function toCardinalDirection(degrees) {
  const numeric = numberOrNull(degrees);
  if (numeric === null) return null;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((numeric % 360) / 45)) % 8;
  return directions[index];
}
