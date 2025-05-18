import { safeFetchJSON, API_BASE_URL } from './utils.js';
import { map } from './map.js';

export const selectedCoords = {
  start: null,
  end: null
};

export async function planRoute() {
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
      if (step.geom?.coordinates) {
        const [lng, lat] = step.geom.coordinates;
        routePath.push({ lat, lng });
      }
    }

    const leafletPolyline = L.polyline(routePath, {
      color: '#FF0000',
      weight: 4,
      opacity: 1.0
    }).addTo(map);

    // Build a readable text-based summary of the route based on station names and transfers
    const instructionsContainer = document.getElementById('route-instructions');
    if (instructionsContainer) {
      instructionsContainer.classList.remove('hidden');
      const steps = [];

      let totalDistance = 0;
      let totalTimeMin = 0;

      // Estimate walking time (1.4 m/s ≈ 85 m/min)
      if (startRes.distance_m > 100) {
        const walkTime = Math.round(startRes.distance_m / 85);
        totalDistance += startRes.distance_m;
        totalTimeMin += walkTime;
        steps.push(`<li>🚶 <strong>Walk</strong> from your location to <strong>${startRes.name}</strong><br>
    <em>${Math.round(startRes.distance_m)} meters (~${walkTime} min)</em></li>`);
      }

      // Group route segments by line
      let lastLine = null;
      let currentSegment = [];
      let segmentLine = '';
      let segmentStartStation = '';
      let segmentStopCount = 0;

      const flushSegment = () => {
        if (segmentStopCount > 0 && segmentLine && segmentStartStation) {
          steps.push(`<li>🚆 Take <strong>${segmentLine}</strong> from <strong>${segmentStartStation}</strong> (${segmentStopCount} stop${segmentStopCount > 1 ? 's' : ''})</li>`);
          totalTimeMin += Math.max(2, segmentStopCount * 2);  // ~2 min/stop
        }
        currentSegment = [];
        segmentLine = '';
        segmentStartStation = '';
        segmentStopCount = 0;
      };

      for (let i = 0; i < routeRes.length; i++) {
        const step = routeRes[i];
        const station = step.station_name_en || step.station_name || '(unknown)';
        const lineName = step.line_name_en || step.line_name || '(unknown line)';

        const isFirst = i === 0;
        const isLast = i === routeRes.length - 1;
        const transfer = lineName !== lastLine;

        if (isFirst || transfer) {
          flushSegment();
          segmentLine = lineName;
          segmentStartStation = station;
        }

        if (!isFirst && !transfer && !isLast) {
          segmentStopCount++;
        }

        if (isLast) {
          flushSegment();
          steps.push(`<li>🏁 Arrive at <strong>${station}</strong></li>`);
        }

        lastLine = lineName;
      }

      if (endRes.distance_m > 100) {
        const walkTime = Math.round(endRes.distance_m / 85);
        totalDistance += endRes.distance_m;
        totalTimeMin += walkTime;
        steps.push(`<li>🚶 <strong>Walk</strong> from <strong>${endRes.name}</strong> to your destination<br>
    <em>${Math.round(endRes.distance_m)} meters (~${walkTime} min)</em></li>`);
      }

      instructionsContainer.innerHTML = `
        <div class="route-summary">
          <h3>Route Summary</h3>
          <p><strong>Total Distance:</strong> ${Math.round(totalDistance)}m<br>
          <strong>Estimated Time:</strong> ~${totalTimeMin} min</p>
          <ul class="route-steps">${steps.join('')}</ul>
        </div>
      `;
    }

  } catch (err) {
    console.error('Route planning error:', err);
    console.error(err.stack);
    alert('Error planning route: ' + err.message);
  } finally {
    document.getElementById('plan-route').disabled = false;
    document.getElementById('plan-route').textContent = 'Plan Route';
  }
}