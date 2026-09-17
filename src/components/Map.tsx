import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import { MapLibreMap, NavigationControl, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Firework } from "../lib/fireworks";
import { BUCKET_COLORS } from "../lib/fireworks";

interface MapProps {
  fireworks: Firework[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  /** A new object here means "move the map", so repeat clicks fly again. */
  flyTo: { coordinates: [number, number] } | null;
}

// maplibre looks for its worker in a file next to its own entry point, a path
// that stops existing once the bundler has hashed everything into dist/assets.
// Without this the map silently never renders in a production build.
setWorkerUrl(workerUrl);

const DRESDEN_CENTER: [number, number] = [13.7372, 51.0504];
const INITIAL_ZOOM = 11;

const MAP_THEMES = {
  light: {
    style: "https://tiles.openfreemap.org/styles/positron",
    halo: "#ffffff",
  },
  dark: {
    style: "https://tiles.openfreemap.org/styles/dark",
    // The dark style's own background, so the halo reads as a cut-out.
    halo: "#0c0c0c",
  },
};

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

const subscribeToScheme = (onChange: () => void) => {
  darkScheme.addEventListener("change", onChange);
  return () => darkScheme.removeEventListener("change", onChange);
};

/** The map draws on a canvas, so CSS cannot theme it for us. */
const useMapTheme = () =>
  useSyncExternalStore(subscribeToScheme, () =>
    darkScheme.matches ? MAP_THEMES.dark : MAP_THEMES.light,
  );

const toGeoJSON = (fireworks: Firework[]): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: fireworks.map((firework) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: firework.coordinates },
    properties: {
      id: firework.id,
      color: BUCKET_COLORS[firework.bucket],
      // Category 4 is the professional-grade, louder one, so it draws bigger.
      radius: firework.kategorie >= 4 ? 9 : 6,
    },
  })),
});

export function Map({ fireworks, selectedId, onSelect, flyTo }: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const theme = useMapTheme();
  // The style loads asynchronously, so the layers are added from the latest
  // props rather than the ones captured when the map was created. This effect
  // is declared first so it has run by the time the map is created below.
  const latest = useRef({ fireworks, selectedId, onSelect, theme });
  useEffect(() => {
    latest.current = { fireworks, selectedId, onSelect, theme };
  });

  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new MapLibreMap({
      container: container.current,
      style: latest.current.theme.style,
      center: DRESDEN_CENTER,
      zoom: INITIAL_ZOOM,
    });
    map.current = instance;

    instance.addControl(new NavigationControl(), "bottom-right");

    // "style.load" rather than "load", because swapping the style for a theme
    // change drops everything added here and fires this again.
    instance.on("style.load", () => {
      instance.addSource("fireworks", {
        type: "geojson",
        data: toGeoJSON(latest.current.fireworks),
      });

      instance.addLayer({
        id: "fireworks-selected",
        type: "circle",
        source: "fireworks",
        paint: {
          "circle-radius": ["+", ["get", "radius"], 8],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.25,
        },
        filter: ["==", ["get", "id"], latest.current.selectedId ?? -1],
      });

      instance.addLayer({
        id: "fireworks-circle",
        type: "circle",
        source: "fireworks",
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": latest.current.theme.halo,
        },
      });
    });

    instance.on("click", "fireworks-circle", (e) => {
      const feature = e.features?.[0];
      if (feature) latest.current.onSelect(feature.properties.id as number);
    });

    instance.on("click", (e) => {
      const hits = instance.queryRenderedFeatures(e.point, {
        layers: ["fireworks-circle"],
      });
      if (!hits.length) latest.current.onSelect(null);
    });

    instance.on("mouseenter", "fireworks-circle", () => {
      instance.getCanvas().style.cursor = "pointer";
    });

    instance.on("mouseleave", "fireworks-circle", () => {
      instance.getCanvas().style.cursor = "";
    });
  }, []);

  // The map is built with the first render's style, so only later switches need
  // a swap. Diffing is off because the two styles have nothing in common.
  const appliedStyle = useRef(theme.style);
  useEffect(() => {
    if (!map.current || appliedStyle.current === theme.style) return;
    appliedStyle.current = theme.style;
    map.current.setStyle(theme.style, { diff: false });
  }, [theme]);

  useEffect(() => {
    const source = map.current?.getSource<GeoJSONSource>("fireworks");
    source?.setData(toGeoJSON(fireworks));
  }, [fireworks]);

  useEffect(() => {
    if (!map.current?.getLayer("fireworks-selected")) return;
    map.current.setFilter("fireworks-selected", [
      "==",
      ["get", "id"],
      selectedId ?? -1,
    ]);
  }, [selectedId]);

  useEffect(() => {
    if (!flyTo || !map.current) return;
    map.current.flyTo({
      center: flyTo.coordinates,
      zoom: Math.max(map.current.getZoom(), 14),
    });
  }, [flyTo]);

  return <div ref={container} className="map-container" />;
}
