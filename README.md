# Check The Bay · Pro Map demo

A self-contained Leaflet-based map for Mobile Bay and the wider Gulf of Mexico. Designed to be embedded inside a mobile WebView (e.g., Base44) or served as a static page.

## Quick start
1. Serve the static files in this folder (e.g., with any static file host). The entry point is `index.html`.
2. Open the page in your browser or WebView. The map will initialize automatically with the default data endpoints and fit the
   wider Gulf of Mexico view. A bottom-left control offers quick jumps to Mobile Bay or the Gulf overview.

## Embedding with custom endpoints
If you need to provide your own backend URLs at runtime, call the global initializer after the page loads:

```html
<link rel="stylesheet" href="styles.css" />
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="main.js"></script>
<script>
  window.initProMap({
    reefsUrl: 'https://YOUR_BACKEND/reefs/inshore',
    stationsUrl: 'https://YOUR_BACKEND/stations',
  });
</script>
```

If you omit the call, the map falls back to the hardcoded defaults in `main.js`.

## Data sources
- **Reefs**: Fetched from the configured `reefsUrl` and rendered as blue circle markers.
- **Stations**: Loaded from `stationsUrl` GeoJSON; active stations appear green and inactive ones red.
- **Wind/Current field**: Uses `data/sampleWindField.json` as a demo; swap this file for a live feed without changing the front-end logic.

## Layer toggles and controls
- The top-right layers menu controls Wind/Currents, Stations, and Reefs visibility (satellite imagery always on).
- The bottom-left pills let you jump to Mobile Bay or the wider Gulf overview.
- The legend in the bottom-right shows symbol meanings and live counts of stations/reefs in the current view.

## Notes for WebViews
- The layout uses full-viewport sizing (`#map` fills the window) and touch-friendly controls for mobile embeddings.
- No build step is required; all dependencies load from CDNs.
