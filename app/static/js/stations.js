// stations.js
import { map } from './map.js';
import { safeFetchJSON, API_BASE_URL } from './utils.js';

export let stationLayer = null;

export async function loadStations() {
  const data = await safeFetchJSON(`${API_BASE_URL}/api/stations`);

  stationLayer = L.geoJSON(data, {
    pane: 'markerPane',
    pointToLayer: (feature, latlng) =>
      L.circleMarker(latlng, {
        className: 'station-marker',
        radius: 6
      }),
    onEachFeature: (feature, layer) => {
      const itemID = feature.properties.gid || '';
      const nameJP = feature.properties.n02_005 || 'Unknown';
      const nameEN = feature.properties.n02_005_en || '';
      const operatorJP = feature.properties.n02_004 || 'Unknown';
      const operatorEN = feature.properties.n02_004_en || '';

      layer.bindPopup(
        L.popup({ className: 'custom-popup' }).setContent(
          `<strong>${nameJP}</strong><br>` +
          `${nameEN ? nameEN + '<br>' : ''}` +
          `${operatorJP}<br>` +
          `${operatorEN}` +
          `${itemID}`
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

  updateStationVisibility();
  map.on('zoomend', updateStationVisibility);
}