const fetchImpl = globalThis.fetch;

if (!fetchImpl) {
  throw new Error(
    "Global fetch is not available. Please run this service on Node 18+ or add a fetch polyfill."
  );
}

export async function fetchWithTimeout(url, { timeoutMs = 12_000, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: options.signal || controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
