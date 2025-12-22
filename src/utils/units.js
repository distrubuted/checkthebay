export function mphToKnots(mph) {
  if (mph === null || mph === undefined) return null;
  const numeric = Number.parseFloat(mph);
  return Number.isFinite(numeric) ? Number.parseFloat((numeric * 0.868976).toFixed(2)) : null;
}

export function celsiusToFahrenheit(celsius) {
  if (celsius === null || celsius === undefined) return null;
  const numeric = Number.parseFloat(celsius);
  return Number.isFinite(numeric) ? Number.parseFloat(((numeric * 9) / 5 + 32).toFixed(1)) : null;
}

export function inchesToFeet(inches) {
  if (inches === null || inches === undefined) return null;
  const numeric = Number.parseFloat(inches);
  return Number.isFinite(numeric) ? Number.parseFloat((numeric / 12).toFixed(2)) : null;
}
