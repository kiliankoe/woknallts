/**
 * Keeps data/fireworks.json as the running record of Dresden's medium and large
 * fireworks.
 *
 * The city publishes only what is announced plus the past two weeks, so every
 * firework disappears from the API a fortnight after it went off. This script
 * folds each day's response into the archive instead of replacing it, which is
 * the only way the site can answer "wo hat es hier schon geknallt".
 *
 * The API's `status` is dropped: it says "zukünftig" or "bereits stattgefunden"
 * relative to the day of the request, so keeping it would rewrite every row
 * daily for no gain. The app derives it from `abbrenn_datum` instead.
 */

import type {
  FireworkArchive,
  FireworkFeature,
  FireworkProperties,
} from "../src/lib/fireworks.ts";

/**
 * Picks the archive's fields explicitly, which drops both the per-geometry CRS
 * and the `status` the city sends along.
 */
function clean(feature: FireworkFeature): FireworkFeature {
  const p: FireworkProperties = feature.properties;

  return {
    type: "Feature",
    id: feature.id,
    geometry: { type: "Point", coordinates: feature.geometry.coordinates },
    properties: {
      standort: p.standort,
      jahr: p.jahr,
      abbrenn_datum: p.abbrenn_datum,
      art: p.art,
      kategorie: p.kategorie,
      anlass: p.anlass,
      anzahl: p.anzahl,
      ds_modified: p.ds_modified,
    },
  };
}

export function mergeFireworks(
  archive: FireworkArchive,
  response: unknown,
): FireworkArchive {
  const incoming = (response as { features: FireworkFeature[] }).features ?? [];
  const byId = new Map(archive.features.map((f) => [f.id, clean(f)]));

  for (const feature of incoming) {
    byId.set(feature.id, clean(feature));
  }

  return {
    type: "FeatureCollection",
    features: [...byId.values()].sort((a, b) => a.id - b.id),
  };
}

const PATH = "data/fireworks.json";
const API =
  "https://kommisdd.dresden.de/net4/public/ogcapi/collections/L1554/items";

if (import.meta.main) {
  const archive: FireworkArchive = (await Bun.file(PATH).exists())
    ? JSON.parse(await Bun.file(PATH).text())
    : { type: "FeatureCollection", features: [] };

  const response = await fetch(API);
  if (!response.ok) {
    throw new Error(`${API} responded ${response.status}`);
  }

  const merged = mergeFireworks(archive, await response.json());
  await Bun.write(PATH, `${JSON.stringify(merged, null, 2)}\n`);

  const added = merged.features.length - archive.features.length;
  console.log(`${merged.features.length} fireworks archived, ${added} new`);
}
