import { map } from './map.js';
import { loadLines } from './lines.js';
import { loadStations } from './stations.js';
import { adjustLineThickness } from './adjustments.js';
import { safeFetchJSON, API_BASE_URL } from './utils.js';
import { loadGoogleMapsAPI } from './config.js';

const selectedCoords = {
  start: null,
  end: null
};

export function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

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

async function planRoute() {
  try {
    document.getElementById('plan-route').disabled = true;
    document.getElementById('plan-route').textContent = 'Planning...';

    const startCoords = selectedCoords.start;
    const endCoords = selectedCoords.end;

    if (!startCoords || !endCoords) {
      throw new Error('Start or end address not selected.');
    }

    // Step 1: Find nearest stations to start and end coordinates
    const startRes = await safeFetchJSON(`${API_BASE_URL}/api/nearest_station?lat=${startCoords.lat}&lon=${startCoords.lon}`);
    const endRes = await safeFetchJSON(`${API_BASE_URL}/api/nearest_station?lat=${endCoords.lat}&lon=${endCoords.lon}`);

    if (!startRes.id || !endRes.id) {
      throw new Error('Could not find nearest stations.');
    }

    console.log(`Start station: ${startRes.name} (${startRes.id})`);
    console.log(`End station: ${endRes.name} (${endRes.id})`);
    console.log(`Start station coords:`, startRes.geom?.coordinates || 'N/A');
    console.log(`End station coords:`, endRes.geom?.coordinates || 'N/A');

    // Step 2: Get route from pgRouting API
    const routeRes = await safeFetchJSON(`${API_BASE_URL}/api/route/${startRes.node_id}/${endRes.node_id}`);
    if (!Array.isArray(routeRes) || routeRes.length === 0) {
      throw new Error('No route returned from pgRouting.');
    }

    console.log('Route:', routeRes);

    // Step 3: Plot route on map
    const routePath = [];
    for (const step of routeRes) {
      if (step.source_geom && step.target_geom) {
        const src = step.source_geom.coordinates;
        const tgt = step.target_geom.coordinates;
        routePath.push({ lat: src[1], lng: src[0] });
        routePath.push({ lat: tgt[1], lng: tgt[0] });
      }
    }

    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });

    polyline.setMap(map);

    alert(`Route found with ${routeRes.length} steps.`);
  } catch (err) {
    console.error('Route planning error:', err);
    console.error(err.stack);
    alert('Error planning route: ' + err.message);
  } finally {
    document.getElementById('plan-route').disabled = false;
    document.getElementById('plan-route').textContent = 'Plan Route';
  }
}

initialize();