// Initialize the map
const map = L.map('map').setView([36.2048, 138.2529], 5); // Centered on Japan

// Load base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

let lineLayer;

function updateLineLayer() {
  if (lineLayer) {
    map.removeLayer(lineLayer);
  }

  fetch('http://localhost:5050/api/lines')
    .then(response => response.json())
    .then(data => {
      const jrOperators = new Set();
      const allOperators = new Set();
      let jrCount = 0;

      data.features.forEach(f => {
        const opRaw = f.properties.n02_003;
        const op = opRaw ? opRaw.trim() : null;

        if (op) {
          allOperators.add(op);
          if (op.includes('旅客鉄道') && !op.includes('貨物')) {
            jrOperators.add(op);
            jrCount++;
          }
        }
      });

      console.log("All operators found in line data:", Array.from(allOperators));
      console.log(`Matching JR passenger lines: ${jrCount}`);
      console.log("Operators starting with 'JR':", Array.from(jrOperators));

      L.geoJSON(data, {
        style: {
          color: '#333',
          weight: 2
        },
        onEachFeature: (feature, layer) => {
          const lineName = feature.properties.n02_004 || 'Unknown';
          const operator = feature.properties.n02_003 || 'Unknown';
          layer.bindPopup(`<strong>${lineName}</strong><br>${operator}`);
        }
      }).addTo(map);
    });
}

// Load initially
updateLineLayer();

// Load JR stations
fetch('http://localhost:5050/api/stations')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, { radius: 4, fillColor: '#333', color: '#fff', weight: 1, fillOpacity: 0.8 }),
      onEachFeature: (feature, layer) => {
        const name = feature.properties.n02_005 || 'Unknown';
        const operator = feature.properties.n02_004 || 'Unknown';
        layer.bindPopup(`<strong>${name}</strong><br>${operator}`);
      }
    }).addTo(map);
  });