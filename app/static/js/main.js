// Initialize the map
const map = L.map('map').setView([38.2048, 138.2529], 6); // Centered on Japan

const API_BASE_URL = 'http://localhost:5050';

const geoJsonOptions = {
  style: (feature) => {
    const name = feature.properties.n02_004_en || '';
    if (name.includes('Hokkaido Railway')) return { className: 'line-hokkaido' };
    if (name.includes('East Japan Railway')) return { className: 'line-east' };
    if (name.includes('Central Japan Railway')) return { className: 'line-central' };
    if (name.includes('Aoimori Railway')) return { className: 'line-central' };
    if (name.includes('Ainokaze Toyama Railway')) return { className: 'line-west' };
    if (name.includes('West Japan Railway')) return { className: 'line-west' };
    if (name.includes('Shikoku Railway')) return { className: 'line-shikoku' };
    if (name.includes('Tokyo Monorail')) return { className: 'line-shikoku' };
    if (name.includes('Kyushu Railway')) return { className: 'line-kyushu' };
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
    L.circleMarker(latlng, {
      className: 'station-marker',
      radius: 6 // Increased size for better visibility compared to lines
    }),
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
// L.tileLayer('https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { // Humanity
// L.tileLayer('https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${MAP_API_KEY}', { // Thunderforest Outdoor
L.tileLayer(`https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=${MAP_API_KEY}`, { // Thunderforest Neighborhood
  attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
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
          const lineName = feature.properties.n02_003_en || '';
          const classes = [];

          if (name.includes('Hokkaido Railway')) classes.push('line-hokkaido');
          else if (name.includes('East Japan Railway')) classes.push('line-east');
          else if (name.includes('Central Japan Railway')) classes.push('line-central');
          else if (name.includes('Aoimori Railway')) classes.push('line-central');
          else if (name.includes('Ainokaze Toyama Railway')) classes.push('line-west');
          else if (name.includes('West Japan Railway')) classes.push('line-west');
          else if (name.includes('Shikoku Railway')) classes.push('line-shikoku');
          else if (name.includes('Tokyo Monorail')) classes.push('line-shikoku');
          else if (name.includes('Kyushu Railway')) classes.push('line-kyushu');
          else if (name.includes('Ishikawa Railway')) classes.push('line-other');
          else classes.push('line-default');

          if (lineName.includes('Shinkansen')) {
            classes.push('line-shinkansen');
          }

          return { className: classes.join(' ') };
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
        L.circleMarker(latlng, {
          className: 'station-marker',
          radius: 6 // Increased size for better visibility compared to lines
        }),
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