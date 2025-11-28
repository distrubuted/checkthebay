let cachedFetch = globalThis.fetch;

/**
 * Ensure a fetch implementation is available in runtimes that may not yet ship
 * global fetch (e.g., older Node releases on some hosts). On Node 18+ the
 * built-in fetch is used; otherwise we lazily import node-fetch and attach it
 * to globalThis to keep existing code paths working.
 */
export async function ensureFetch() {
  if (!cachedFetch) {
    const mod = await import("node-fetch");
    cachedFetch = mod.default;
    globalThis.fetch = cachedFetch;
  }
  return cachedFetch;
}

export function getFetchSync() {
  return cachedFetch || globalThis.fetch;
}
