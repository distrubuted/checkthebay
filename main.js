/*
 * Check The Bay · Pro Map
 * Front-end only Leaflet experience for Mobile Bay and the Gulf of Mexico.
 */

const DEFAULT_REEFS_URL = "https://YOUR_BACKEND/reefs/inshore";
const DEFAULT_STATIONS_URL = "https://YOUR_BACKEND/stations";
const MOBILE_BAY = [30.3, -88.0];
const GULF_BOUNDS = [
  [18.0, -98.5],
  [32.5, -77.5],
];

const layerState = {
  wind: true,
  stations: true,
  reefs: true,
};

let map;
let reefLayer = L.layerGroup();
let stationLayer = L.geoJSON(null, {
  pointToLayer: (feature, latlng) => {
    const isActive = Boolean(feature.properties?.active);
    const color = isActive ? "#2ecc71" : "#e74c3c";
    return L.circleMarker(latlng, {
      radius: 6,
      weight: 2,
      color: "#ffffff",
      fillColor: color,
      fillOpacity: 0.9,
    });
  },
  onEachFeature: (feature, layer) => {
    const { name, provider, windSpeed, waveHeight, waterTemp, active } =
      feature.properties || {};
    const statusLabel = active ? "Active" : "Inactive";
    const rows = [
      name || "Unnamed station",
      provider ? `Provider: ${provider}` : null,
      `Status: ${statusLabel}`,
      windSpeed != null ? `Wind: ${windSpeed} kt` : null,
      waveHeight != null ? `Waves: ${waveHeight} m` : null,
      waterTemp != null ? `Water Temp: ${waterTemp} °C` : null,
    ].filter(Boolean);
    layer.bindPopup(rows.join("<br/>"));
  },
});
let windLayer;
let windDataCache = null;
let countsEl;
let reefsUrl = DEFAULT_REEFS_URL;
let stationsUrl = DEFAULT_STATIONS_URL;

function initProMap(options = {}) {
  reefsUrl = options.reefsUrl || DEFAULT_REEFS_URL;
  stationsUrl = options.stationsUrl || DEFAULT_STATIONS_URL;

  map = L.map("map", {
    center: MOBILE_BAY,
    zoom: 7,
    zoomControl: false,
    preferCanvas: true,
  });

  map.fitBounds(GULF_BOUNDS, { padding: [16, 16] });

  const imagery = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxZoom: 18,
    }
  );
  imagery.addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  createTitleControl().addTo(map);
  createLayerControl().addTo(map);
  createCenterControl().addTo(map);
  createLegendControl().addTo(map);

  loadReefs();
  loadStations();
  loadWindField().then((data) => {
    windDataCache = data;
    if (layerState.wind) {
      addWindLayer();
    }
  });

  map.on("moveend", updateCountsInView);
  updateCountsInView();
}

function createTitleControl() {
  const TitleControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "map-title");
      div.innerText = "Check The Bay · Pro Map";
      return div;
    },
  });
  return new TitleControl();
}

function createCenterControl() {
  const CenterControl = L.Control.extend({
    options: { position: "bottomleft" },
    onAdd() {
      const container = L.DomUtil.create("div", "control-card center-actions");
      const mobileBtn = L.DomUtil.create("button", "center-btn", container);
      mobileBtn.type = "button";
      mobileBtn.innerText = "Center on Mobile Bay";
      L.DomEvent.on(mobileBtn, "click", () => {
        map.setView(MOBILE_BAY, 8, { animate: true });
      });

      const gulfBtn = L.DomUtil.create("button", "center-btn secondary", container);
      gulfBtn.type = "button";
      gulfBtn.innerText = "Gulf overview";
      L.DomEvent.on(gulfBtn, "click", () => {
        map.fitBounds(GULF_BOUNDS, { animate: true, padding: [16, 16] });
      });

      return container;
    },
  });
  return new CenterControl();
}

function createLayerControl() {
  const LayerControl = L.Control.extend({
    options: { position: "topright" },
    onAdd() {
      const container = L.DomUtil.create("div", "layers-control");
      container.setAttribute("aria-label", "Layer toggles");
      L.DomEvent.disableClickPropagation(container);

      const toggleBtn = L.DomUtil.create("button", "layers-toggle", container);
      toggleBtn.type = "button";
      toggleBtn.innerText = "Layers";

      const panel = L.DomUtil.create("div", "control-card layer-panel", container);
      panel.hidden = true;
      panel.innerHTML = `
        <h4>Layers</h4>
        <label><input type="checkbox" checked disabled /> Satellite Imagery</label>
        <label><input type="checkbox" data-layer="wind" checked /> Wind / Currents</label>
        <label><input type="checkbox" data-layer="stations" checked /> Stations</label>
        <label><input type="checkbox" data-layer="reefs" checked /> Reefs</label>
      `;

      toggleBtn.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
      });

      panel.querySelectorAll("input[type='checkbox']").forEach((input) => {
        input.addEventListener("change", (evt) => {
          const key = evt.target.dataset.layer;
          if (!key) return;
          layerState[key] = evt.target.checked;
          handleLayerToggle(key);
        });
      });

      return container;
    },
  });
  return new LayerControl();
}

function createLegendControl() {
  const LegendControl = L.Control.extend({
    options: { position: "bottomright" },
    onAdd() {
      const container = L.DomUtil.create("div", "control-card map-legend");
      container.innerHTML = `
        <div class="legend-item">
          <span class="legend-dot dot-station-active"></span>
          <span>Active station</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot dot-station-inactive"></span>
          <span>Inactive station</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot dot-reef"></span>
          <span>Inshore reef</span>
        </div>
        <div class="legend-item">
          <span class="flow-line"></span>
          <span>Wind / Currents</span>
        </div>
        <div class="counts">
          <div id="count-stations">Stations in view: 0</div>
          <div id="count-reefs">Reefs in view: 0</div>
        </div>
      `;
      countsEl = {
        stations: container.querySelector("#count-stations"),
        reefs: container.querySelector("#count-reefs"),
      };
      return container;
    },
  });
  return new LegendControl();
}

async function loadReefs() {
  try {
    const res = await fetch(reefsUrl);
    const reefs = await res.json();
    const features = Array.isArray(reefs) ? reefs : reefs?.features || [];
    features.forEach((reef) => {
      const { latitude, longitude, name, year } = reef;
      if (latitude == null || longitude == null) return;
      const marker = L.circleMarker([latitude, longitude], {
        radius: 5,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2d9cdb",
        fillOpacity: 0.9,
      });
      const depth = reef.depth ? `Depth: ${reef.depth}` : null;
      const material = reef.material ? `Material: ${reef.material}` : null;
      const rows = [name || "Inshore reef", year ? `Built: ${year}` : null, depth, material].filter(Boolean);
      marker.bindPopup(rows.join("<br/>"));
      marker.addTo(reefLayer);
    });
    if (layerState.reefs) {
      reefLayer.addTo(map);
    }
    updateCountsInView();
  } catch (err) {
    console.error("Failed to load reefs", err);
  }
}

async function loadStations() {
  try {
    const res = await fetch(stationsUrl);
    const geojson = await res.json();
    stationLayer.addData(geojson);
    if (layerState.stations) {
      stationLayer.addTo(map);
    }
    updateCountsInView();
  } catch (err) {
    console.error("Failed to load stations", err);
  }
}

async function loadWindField() {
  if (windDataCache) return windDataCache;
  const res = await fetch("data/sampleWindField.json");
  const data = await res.json();
  windDataCache = data;
  return data;
}

function addWindLayer() {
  if (!windDataCache) return;
  if (windLayer) {
    map.addLayer(windLayer);
    windLayer.resume();
    return;
  }
  windLayer = new WindFieldLayer(windDataCache, {
    opacity: 0.8,
    color: "rgba(255, 255, 255, 0.65)",
    scale: 6,
  });
  windLayer.addTo(map);
}

function handleLayerToggle(key) {
  switch (key) {
    case "wind":
      if (layerState.wind) {
        addWindLayer();
      } else if (windLayer) {
        map.removeLayer(windLayer);
        windLayer.pause();
      }
      break;
    case "stations":
      if (layerState.stations) {
        map.addLayer(stationLayer);
      } else {
        map.removeLayer(stationLayer);
      }
      break;
    case "reefs":
      if (layerState.reefs) {
        map.addLayer(reefLayer);
      } else {
        map.removeLayer(reefLayer);
      }
      break;
    default:
      break;
  }
  updateCountsInView();
}

function updateCountsInView() {
  if (!map || !countsEl) return;
  const bounds = map.getBounds();

  const reefCount = layerState.reefs
    ? reefLayer.getLayers().filter((layer) => bounds.contains(layer.getLatLng())).length
    : 0;
  const stationCount = layerState.stations
    ? stationLayer.getLayers().filter((layer) => bounds.contains(layer.getLatLng())).length
    : 0;

  countsEl.stations.textContent = `Stations in view: ${stationCount}`;
  countsEl.reefs.textContent = `Reefs in view: ${reefCount}`;
}

class WindFieldLayer extends L.Layer {
  constructor(windData, options = {}) {
    super();
    this.windData = windData;
    this.options = options;
    this._canvas = null;
    this._ctx = null;
    this._frame = null;
    this._running = false;
  }

  onAdd(map) {
    this._map = map;
    this._createCanvas();
    this._reset();
    map.getPanes().overlayPane.appendChild(this._canvas);
    map.on("moveend zoomend resize", this._reset, this);
    this.resume();
  }

  onRemove() {
    this.pause();
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    if (this._map) {
      this._map.off("moveend zoomend resize", this._reset, this);
    }
    this._map = null;
  }

  pause() {
    this._running = false;
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = null;
    }
    if (this._canvas) {
      this._canvas.style.display = "none";
    }
  }

  resume() {
    if (!this._canvas) return;
    this._canvas.style.display = "block";
    if (!this._running) {
      this._running = true;
      this._animate();
    }
  }

  _createCanvas() {
    this._canvas = L.DomUtil.create("canvas", "wind-canvas");
    this._ctx = this._canvas.getContext("2d");
  }

  _reset() {
    if (!this._map || !this._canvas) return;
    const size = this._map.getSize();
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = size.x * dpr;
    this._canvas.height = size.y * dpr;
    this._canvas.style.width = `${size.x}px`;
    this._canvas.style.height = `${size.y}px`;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._redraw();
  }

  _redraw() {
    if (!this._ctx) return;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  _animate() {
    if (!this._running) return;
    const draw = (timestamp) => {
      if (!this._running || !this._map) return;
      this._drawFrame(timestamp);
      this._frame = requestAnimationFrame(draw);
    };
    this._frame = requestAnimationFrame(draw);
  }

  _drawFrame(timestamp) {
    if (!this._ctx || !this._map) return;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    const color = this.options.color || "rgba(255, 255, 255, 0.7)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";

    const scale = this.options.scale || 5;

    this.windData.vectors.forEach((vec, idx) => {
      const point = this._map.latLngToContainerPoint([vec.lat, vec.lon]);
      const dx = vec.u * scale;
      const dy = -vec.v * scale;
      const phase = Math.sin(timestamp / 600 + idx);
      const offsetX = dx * 0.2 * phase;
      const offsetY = dy * 0.2 * phase;
      ctx.beginPath();
      ctx.moveTo(point.x - dx / 2 + offsetX, point.y - dy / 2 + offsetY);
      ctx.lineTo(point.x + dx / 2 + offsetX, point.y + dy / 2 + offsetY);
      ctx.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(timestamp / 800 + idx));
      ctx.stroke();
    });
  }
}

window.initProMap = initProMap;

document.addEventListener("DOMContentLoaded", () => {
  initProMap();
});
