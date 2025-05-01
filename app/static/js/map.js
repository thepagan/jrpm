// map.js
import { MAP_API_KEY } from './config.js';

export let map = null;
export let loadingSpinner = null;

if (typeof L === 'undefined') {
  console.error('❌ Leaflet (L) is not loaded yet. Map cannot be initialized.');
} else {
  console.log('✅ Leaflet (L) is loaded, initializing map.');
  map = L.map('map').setView([38.2048, 138.2529], 6); // Centered on Japan

  L.tileLayer(`https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=${MAP_API_KEY}`, {
    attribution: '&copy; Thunderforest &copy; OpenStreetMap contributors',
  }).addTo(map);

  // Loading spinner setup
  loadingSpinner = L.control({ position: 'topleft' });
  loadingSpinner.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'loading-spinner');
    div.innerHTML = `<div id="spinner" style="display:none;">Loading...</div>`;
    return div;
  };
  loadingSpinner.addTo(map);
}