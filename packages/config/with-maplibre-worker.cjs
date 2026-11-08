const fs = require('node:fs');
const path = require('node:path');

// Metro bundles the MapLibre UI module, but its ES module worker must remain
// a separate same-origin file. Expo serves and exports the app's public folder.
module.exports = function withMapLibreWorker(projectRoot) {
  const worker = require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs', { paths: [projectRoot] });
  const publicDir = path.join(projectRoot, 'public');
  const destination = path.join(publicDir, 'maplibre-gl-worker.mjs');
  const contents = fs.readFileSync(worker);
  if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(contents)) {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(destination, contents);
  }
};
