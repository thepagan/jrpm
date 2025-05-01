// lines.js
import { map } from './map.js';
import { safeFetchJSON, API_BASE_URL } from './utils.js';

export let lineLayer = null;

export async function loadLines() {
  const data = await safeFetchJSON(`${API_BASE_URL}/api/lines`);

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
      const itemID = feature.properties.ogc_fid || '';
      const operatorJP = feature.properties.n02_003 || 'Unknown';
      const operatorEN = feature.properties.n02_003_en || '';
      const lineNameJP = feature.properties.n02_004 || 'Unknown';
      const lineNameEN = feature.properties.n02_004_en || '';

      layer.bindPopup(L.popup({ className: 'custom-popup' }).setContent(
        `<strong>${operatorJP}</strong><br>` +
        `${operatorEN ? operatorEN + '<br>' : ''}` +
        `${lineNameJP}<br>` +
        `${lineNameEN}` +
        `${itemID}`
      ));
    }
  });

  lineLayer.addTo(map);
}