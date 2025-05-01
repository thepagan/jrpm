// adjustments.js
import { map } from './map.js';
import { lineLayer } from './lines.js';

export function adjustLineThickness() {
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