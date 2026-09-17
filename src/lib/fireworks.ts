/**
 * The shape of data/fireworks.json, which is the city's own GeoJSON minus the
 * members that describe the request rather than the firework. See
 * scripts/archive-fireworks.ts, which writes it.
 */
export interface FireworkProperties {
  standort: string;
  jahr: number;
  abbrenn_datum: string;
  art: string;
  kategorie: number;
  anlass: string;
  anzahl: number;
  ds_modified: string;
}

export interface FireworkFeature {
  type: "Feature";
  id: number;
  geometry: { type: "Point"; coordinates: number[] };
  properties: FireworkProperties;
}

export interface FireworkArchive {
  type: "FeatureCollection";
  features: FireworkFeature[];
}

/** Where a firework sits relative to today, which is what the site is about. */
export type TimeBucket = "heute" | "kommend" | "vergangen";

export interface Firework {
  id: number;
  standort: string;
  /** ISO date, e.g. "2026-09-27". */
  date: string;
  /** Wall-clock time in Dresden, e.g. "21:15". */
  time: string;
  anlass: string;
  art: string;
  kategorie: number;
  anzahl: number;
  bucket: TimeBucket;
  coordinates: [number, number];
}

export const BUCKET_LABELS: Record<TimeBucket, string> = {
  heute: "Heute",
  kommend: "Angekündigt",
  vergangen: "Vergangen",
};

export const BUCKET_COLORS: Record<TimeBucket, string> = {
  heute: "#dc2626",
  kommend: "#f59e0b",
  vergangen: "#9ca3af",
};

/**
 * The city writes "27.09.2026 21:15:00" and means Dresden's wall clock. Keeping
 * date and time as strings sidesteps the visitor's time zone entirely: nothing
 * has to be converted, because nothing is ever a `Date`.
 */
export function parseDateTime(raw: string): { date: string; time: string } {
  const [day, month, rest] = raw.split(".");
  const [year, time] = rest.split(" ");
  return { date: `${year}-${month}-${day}`, time: time.slice(0, 5) };
}

/** "sv-SE" is the shortest way to an ISO date for a given time zone. */
export function todayInDresden(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    now,
  );
}

export function bucketFor(date: string, today: string): TimeBucket {
  if (date === today) return "heute";
  return date > today ? "kommend" : "vergangen";
}

/**
 * Upcoming fireworks come first and soonest last, since "what is announced" is
 * the question the site answers. Past ones follow, most recent first.
 */
export function parseArchive(
  archive: FireworkArchive,
  today: string,
): Firework[] {
  return archive.features
    .map((feature) => {
      const { date, time } = parseDateTime(feature.properties.abbrenn_datum);
      const [lon, lat] = feature.geometry.coordinates;

      return {
        id: feature.id,
        standort: feature.properties.standort,
        date,
        time,
        anlass: feature.properties.anlass,
        art: feature.properties.art,
        kategorie: feature.properties.kategorie,
        anzahl: feature.properties.anzahl,
        bucket: bucketFor(date, today),
        coordinates: [lon, lat] as [number, number],
      };
    })
    .sort((a, b) => {
      const aUpcoming = a.date >= today;
      const bUpcoming = b.date >= today;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

      const order = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return aUpcoming ? order : -order;
    });
}

/** Which slice of the archive the panel and the map show. */
export type Timeframe = "aktuell" | "vergangen" | "alle";

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  aktuell: "Heute und angekündigt",
  vergangen: "Vergangene",
  alle: "Alle",
};

export function matchesTimeframe(
  bucket: TimeBucket,
  timeframe: Timeframe,
): boolean {
  if (timeframe === "alle") return true;
  if (timeframe === "vergangen") return bucket === "vergangen";
  return bucket !== "vergangen";
}

/**
 * Formats an ISO date for display. Fixing the time zone to UTC on both ends
 * keeps the weekday from slipping a day for visitors west of Greenwich.
 */
export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
