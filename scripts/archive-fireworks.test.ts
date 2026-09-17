import { describe, expect, test } from "bun:test";
import { mergeFireworks } from "./archive-fireworks.ts";
import type { FireworkFeature } from "../src/lib/fireworks.ts";

const feature = (
  id: number,
  overrides: Partial<FireworkFeature["properties"]> = {},
): FireworkFeature => ({
  type: "Feature",
  id,
  geometry: { type: "Point", coordinates: [13.74, 51.05] },
  properties: {
    standort: "Elbufer",
    jahr: 2026,
    abbrenn_datum: "19.09.2026 21:45:00",
    art: "Anzeige",
    kategorie: 4,
    anlass: "Hochzeit",
    anzahl: 2,
    ds_modified: "27.08.2026 17:02:31",
    ...overrides,
  },
});

/** What the city's OGC API hands out, with the members the archive drops. */
const apiResponse = (features: unknown[]) => ({
  type: "FeatureCollection",
  links: [{ rel: "self", href: "https://kommisdd.dresden.de/..." }],
  timeStamp: "2026-09-17T09:31:04.6516782Z",
  features,
  numberReturned: features.length,
});

describe("mergeFireworks", () => {
  test("adds fireworks the archive has not seen", () => {
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [feature(1)] },
      apiResponse([feature(1), feature(2)]),
    );

    expect(merged.features.map((f) => f.id)).toEqual([1, 2]);
  });

  test("keeps fireworks the API has already dropped", () => {
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [feature(1), feature(2)] },
      apiResponse([feature(2)]),
    );

    expect(merged.features.map((f) => f.id)).toEqual([1, 2]);
  });

  test("updates a firework the city has corrected", () => {
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [feature(1)] },
      apiResponse([feature(1, { anlass: "Kirmes" })]),
    );

    expect(merged.features).toHaveLength(1);
    expect(merged.features[0].properties.anlass).toBe("Kirmes");
  });

  test("drops the status, which only restates today's date", () => {
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [] },
      apiResponse([
        {
          ...feature(1),
          properties: { ...feature(1).properties, status: "zukünftig" },
        },
      ]),
    );

    expect(merged.features[0].properties).not.toHaveProperty("status");
  });

  test("drops the response envelope and the redundant CRS", () => {
    const withCrs = {
      ...feature(1),
      geometry: {
        type: "Point",
        coordinates: [13.74, 51.05],
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:EPSG::4326" },
        },
      },
    };
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [] },
      apiResponse([withCrs]),
    );

    expect(merged).toEqual({
      type: "FeatureCollection",
      features: [feature(1)],
    });
  });

  test("orders by id so a new firework is the only line that moves", () => {
    const merged = mergeFireworks(
      { type: "FeatureCollection", features: [feature(10), feature(2)] },
      apiResponse([feature(7)]),
    );

    expect(merged.features.map((f) => f.id)).toEqual([2, 7, 10]);
  });
});
