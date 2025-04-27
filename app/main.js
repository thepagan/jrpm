// Initialize the map
const map = L.map('map').setView([38.2048, 138.2529], 6); // Centered on Japan

const API_BASE_URL = 'http://localhost:5050';

const geoJsonOptions = {
  style: (feature) => {
    const name = feature.properties.n02_004_en || '';
    if (name.includes('Hokkaido Railway Company')) return { className: 'line-hokkaido' };
    if (name.includes('East Japan Railway Company')) return { className: 'line-east' };
    if (name.includes('Central Japan Railway Company')) return { className: 'line-central' };
    if (name.includes('Aoimori Railway')) return { className: 'line-central' };
    if (name.includes('Ainokaze Toyama Railway')) return { className: 'line-west' };
    if (name.includes('West Japan Railway Company')) return { className: 'line-west' };
    if (name.includes('Shikoku Railway')) return { className: 'line-shikoku' };
    if (name.includes('Tokyo Monorail')) return { className: 'line-shikoku' };
    if (name.includes('Kyushu Railway Company')) return { className: 'line-kyushu' };
    if (name.includes('Ishikawa Railway')) return { className: 'line-other' };
    return { className: 'line-default' };
  },
  onEachFeature: (feature, layer) => {
    const operatorJP = feature.properties.n02_003 || 'Unknown';
    const operatorEN = feature.properties.n02_003_en || '';
    const lineNameJP = feature.properties.n02_004 || 'Unknown';
    const lineNameEN = feature.properties.n02_004_en || '';

    layer.bindPopup(L.popup({ className: 'custom-popup' }).setContent(
      `<strong>${operatorJP}</strong><br>` +
      `${operatorEN ? operatorEN + '<br>' : ''}` +
      `${lineNameJP}<br>` +
      `${lineNameEN}`
    ));
  }
};

const stationOptions = {
  pane: 'markerPane',
  pointToLayer: (feature, latlng) =>
    L.circleMarker(latlng, { className: 'station-marker' }),
  onEachFeature: (feature, layer) => {
    const nameJP = feature.properties.n02_005 || 'Unknown';
    const nameEN = feature.properties.n02_005_en || '';
    const operatorJP = feature.properties.n02_004 || 'Unknown';
    const operatorEN = feature.properties.n02_004_en || '';

    layer.bindPopup(
      L.popup({ className: 'custom-popup' }).setContent(
        `<strong>${nameJP}</strong><br>` +
        `${nameEN ? nameEN + '<br>' : ''}` +
        `${operatorJP}<br>` +
        `${operatorEN}`
      )
    );

    layer.on('mouseover', function () {
      this.getElement().classList.add('station-marker-hover');
    });
    layer.on('mouseout', function () {
      this.getElement().classList.remove('station-marker-hover');
    });
  }
};

async function safeFetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

// Load base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

const loadingSpinner = L.control({position: 'topleft'});

loadingSpinner.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'loading-spinner');
    div.innerHTML = `<div id="spinner" style="display:none;">Loading...</div>`;
    return div;
};

loadingSpinner.addTo(map);

let lineLayer;
let stationLayer;

function updateLineLayer() {
  if (lineLayer) {
    map.removeLayer(lineLayer);
  }

  fetch(`${API_BASE_URL}/api/lines`)
    .then(response => response.json())
    .then(data => {
      /*
      const jrCompanies = [
        'Hokkaido Railway Company',
        'East Japan Railway Company',
        'Central Japan Railway Company',
        'West Japan Railway Company',
        'Shikoku Railway',
        'Kyushu Railway Company',
      ];

      const filteredData = {
        ...data,
        features: data.features.filter(feature => {
          const name = feature.properties.n02_004_en || '';
          return jrCompanies.some(company => name.includes(company));
        })
      };
      */

      lineLayer = L.geoJSON(data, {
        style: (feature) => {
          const name = feature.properties.n02_004_en || '';
          if (name.includes('Hokkaido Railway Company')) return { className: 'line-hokkaido' };
          if (name.includes('East Japan Railway Company')) return { className: 'line-east' };
          if (name.includes('Central Japan Railway Company')) return { className: 'line-central' };
          if (name.includes('Aoimori Railway')) return { className: 'line-central' };
          if (name.includes('Ainokaze Toyama Railway')) return { className: 'line-west' };
          if (name.includes('West Japan Railway Company')) return { className: 'line-west' };
          if (name.includes('Shikoku Railway')) return { className: 'line-shikoku' };
          if (name.includes('Tokyo Monorail')) return { className: 'line-shikoku' };
          if (name.includes('Kyushu Railway Company')) return { className: 'line-kyushu' };
          if (name.includes('Ishikawa Railway')) return { className: 'line-other' };
          return { className: 'line-default' };
        },
        onEachFeature: (feature, layer) => {
          const operatorJP = feature.properties.n02_003 || 'Unknown';
          const operatorEN = feature.properties.n02_003_en || '';
          const lineNameJP = feature.properties.n02_004 || 'Unknown';
          const lineNameEN = feature.properties.n02_004_en || '';

          layer.bindPopup(L.popup({ className: 'custom-popup' }).setContent(
            `<strong>${operatorJP}</strong><br>` +
            `${operatorEN ? operatorEN + '<br>' : ''}` +
            `${lineNameJP}<br>` +
            `${lineNameEN}`
          ));
        }
      });

      lineLayer.addTo(map);
    });
}

// Load initially
updateLineLayer();

// Load JR stations after lines have been loaded
fetch(`${API_BASE_URL}/api/stations`)
  .then(response => response.json())
  .then(data => {
    stationLayer = L.geoJSON(data, {
      pane: 'markerPane',
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, { className: 'station-marker' }),
      onEachFeature: (feature, layer) => {
        const nameJP = feature.properties.n02_005 || 'Unknown';
        const nameEN = feature.properties.n02_005_en || '';
        const operatorJP = feature.properties.n02_004 || 'Unknown';
        const operatorEN = feature.properties.n02_004_en || '';

        layer.bindPopup(
          L.popup({ className: 'custom-popup' }).setContent(
            `<strong>${nameJP}</strong><br>` +
            `${nameEN ? nameEN + '<br>' : ''}` +
            `${operatorJP}<br>` +
            `${operatorEN}`
          )
        );

        layer.on('mouseover', function () {
          this.getElement().classList.add('station-marker-hover');
        });
        layer.on('mouseout', function () {
          this.getElement().classList.remove('station-marker-hover');
        });
      }
    });

    stationLayer.addTo(map);

    function updateStationVisibility() {
      const zoom = map.getZoom();
      stationLayer.eachLayer(layer => {
        const el = layer.getElement();
        if (!el) return;
        if (zoom >= 12) {
          el.classList.remove('station-hidden');
        } else {
          el.classList.add('station-hidden');
        }
      });
    }

    updateStationVisibility(); // Call once immediately

    map.on('zoomend', updateStationVisibility);
  });

function adjustLineThickness() {
  const zoom = map.getZoom();
  let newWeight;

  if (zoom < 6) {
    newWeight = 1;
  } else if (zoom < 9) {
    newWeight = 2;
  } else if (zoom < 12) {
    newWeight = 3;
  } else if (zoom < 15) {
    newWeight = 5;
  } else {
    newWeight = 8;
  }

  if (lineLayer) {
    lineLayer.eachLayer(layer => {
      layer.setStyle({ weight: newWeight });
    });
  }
}

adjustLineThickness(); // Immediately adjust once after loading
map.on('zoomend', adjustLineThickness);

let geoLayer = null;
let geoStationLayer = null;
let schematicLayer = null;
let schematicStationLayer = null;
let currentView = "geographic";
let schematicLoaded = false;


// Add toggle button
const viewToggle = L.control({position: 'topright'});

viewToggle.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'view-toggle');
    div.innerHTML = `
      <button id="toggleViewBtn">Switch to Schematic View</button>
    `;
    return div;
};

viewToggle.addTo(map);

document.getElementById('toggleViewBtn').addEventListener('click', async () => {
    if (currentView === "geographic") {
        if (!schematicLoaded) {
            document.getElementById('spinner').style.display = 'block'; // Show spinner

            // Lazy load schematic data
            const [schematicLinesData, schematicStationsData] = await Promise.all([
                safeFetchJSON(`${API_BASE_URL}/api/lines`),
                safeFetchJSON(`${API_BASE_URL}/api/stations`)
            ]);

            // Apply schematic styling
            schematicLayer = L.geoJSON(schematicLinesData, {
                style: feature => ({
                    color: '#ff00ff', // Pink lines for schematic
                    weight: 3,
                    opacity: 0.9
                })
            });

            schematicStationLayer = L.geoJSON(schematicStationsData, {
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: "#00ffff", // Light blue stations
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            });

            schematicLoaded = true;

            document.getElementById('spinner').style.display = 'none'; // Hide spinner
        }

        // Switch to schematic
        if (lineLayer) map.removeLayer(lineLayer);
        if (stationLayer) map.removeLayer(stationLayer);
        schematicLayer.addTo(map);
        schematicStationLayer.addTo(map);
        document.getElementById('toggleViewBtn').innerText = "Switch to Geographic View";
        currentView = "schematic";
    } else {
        // Switch back to geographic
        if (schematicLayer) map.removeLayer(schematicLayer);
        if (schematicStationLayer) map.removeLayer(schematicStationLayer);
        lineLayer.addTo(map);
        stationLayer.addTo(map);
        document.getElementById('toggleViewBtn').innerText = "Switch to Schematic View";
        currentView = "geographic";
    }
});