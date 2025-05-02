import { map } from './map.js';
import { loadLines } from './lines.js';
import { loadStations } from './stations.js';
import { adjustLineThickness } from './adjustments.js';
import { safeFetchJSON, API_BASE_URL } from './utils.js';
import { loadGoogleMapsAPI } from './config.js';
import { planRoute, selectedCoords } from './routeFinder.js';

async function initialize() {
  console.log('🚀 Initializing map and stations...');
  try {
    await loadGoogleMapsAPI();
    await loadLines();
    console.log('✅ Lines loaded.');
    await loadStations();
    console.log('✅ Stations loaded.');
    adjustLineThickness();
    map.on('zoomend', adjustLineThickness);
    console.log('✅ Map layers initialized.');

    await google.maps.importLibrary("places");

    const startInput = document.getElementById('start-address');
    const endInput = document.getElementById('end-address');

    const startAutocomplete = new google.maps.places.Autocomplete(startInput, { fields: ['geometry'], componentRestrictions: { country: 'jp' } });
    const endAutocomplete = new google.maps.places.Autocomplete(endInput, { fields: ['geometry'], componentRestrictions: { country: 'jp' } });

    startAutocomplete.addListener('place_changed', () => {
      const place = startAutocomplete.getPlace();
      console.log('📍 Start Place Selected:', place);
      if (place.geometry && place.geometry.location) {
        selectedCoords.start = {
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng()
        };
        endInput.focus();
      } else {
        alert('Please select a valid start address from the suggestions.');
      }
    });

    endAutocomplete.addListener('place_changed', () => {
      const place = endAutocomplete.getPlace();
      console.log('📍 End Place Selected:', place);
      if (place.geometry && place.geometry.location) {
        selectedCoords.end = {
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng()
        };
      } else {
        alert('Please select a valid end address from the suggestions.');
      }
    });

    const planButton = document.getElementById('plan-route');
    let debounceTimeout;
    planButton.addEventListener('click', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(planRoute, 300);
    });

    console.log('✅ Google Maps Autocomplete initialized.');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Some map features failed to load, but basic functions are available.');
  }
}

initialize();