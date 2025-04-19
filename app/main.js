// Initialize the map
const map = L.map('map').setView([36.2048, 138.2529], 5); // Centered on Japan

// Load base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

let lineLayer;
let stationLayer;

function updateLineLayer() {
  if (lineLayer) {
    map.removeLayer(lineLayer);
  }

  fetch('http://localhost:5050/api/lines')
    .then(response => response.json())
    .then(data => {
      lineLayer = L.geoJSON(data, {
        style: {
          color: '#0074D9',
          weight: 2
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

// Load JR stations
fetch('http://localhost:5050/api/stations')
  .then(response => response.json())
  .then(data => {
    stationLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, { radius: 4, fillColor: '#333', color: '#fff', weight: 1, fillOpacity: 0.8 }),
      onEachFeature: (feature, layer) => {
        const nameJP = feature.properties.n02_005 || 'Unknown';
        const nameEN = feature.properties.n02_005_en || '';
        const operatorJP = feature.properties.n02_004 || 'Unknown';
        const operatorEN = feature.properties.n02_004_en || '';

        layer.bindPopup(L.popup({ className: 'custom-popup' }).setContent(
          `<strong>${nameJP}</strong><br>` +
          `${nameEN ? nameEN + '<br>' : ''}` +
          `${operatorJP}<br>` +
          `${operatorEN}`
        ));
      }
    }).addTo(map);
  });