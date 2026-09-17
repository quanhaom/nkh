import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const maplibrePackage = require.resolve(
  "maplibre-gl/package.json"
);

const dist = path.join(
  path.dirname(maplibrePackage),
  "dist"
);

const destination = path.join(
  process.cwd(),
  "public",
  "maplibre"
);

mkdirSync(destination, {
  recursive: true,
});

const files = [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
  "maplibre-gl-worker.mjs.map",
  "maplibre-gl-shared.mjs.map",
];

for (const file of files) {
  const source = path.join(dist, file);

  if (!existsSync(source)) {
    console.log(`Skipped: ${file}`);
    continue;
  }

  copyFileSync(
    source,
    path.join(destination, file)
  );

  console.log(`Copied: ${file}`);
}

console.log(
  "MapLibre files copied to public/maplibre"
);