import { describe, expect, test } from "bun:test";
import {
  bucketFor,
  formatDate,
  matchesTimeframe,
  parseArchive,
  parseDateTime,
  todayInDresden,
} from "./fireworks.ts";
import type { FireworkArchive } from "./fireworks.ts";

const archive = (
  ...dates: [id: number, abbrenn_datum: string][]
): FireworkArchive => ({
  type: "FeatureCollection",
  features: dates.map(([id, abbrenn_datum]) => ({
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [13.74, 51.05] },
    properties: {
      standort: "Elbufer",
      jahr: 2026,
      abbrenn_datum,
      art: "Anzeige",
      kategorie: 4,
      anlass: "Hochzeit",
      anzahl: 1,
      ds_modified: "27.08.2026 17:02:31",
    },
  })),
});

describe("parseDateTime", () => {
  test("splits the city's German timestamp into date and time", () => {
    expect(parseDateTime("27.09.2026 21:15:00")).toEqual({
      date: "2026-09-27",
      time: "21:15",
    });
  });
});

describe("todayInDresden", () => {
  test("uses Dresden's calendar day, not the visitor's", () => {
    // 22:30 UTC on the 26th is already the 27th in Dresden.
    expect(todayInDresden(new Date("2026-09-26T22:30:00Z"))).toBe("2026-09-27");
  });
});

describe("bucketFor", () => {
  test("sorts a firework into past, today and upcoming", () => {
    expect(bucketFor("2026-09-16", "2026-09-17")).toBe("vergangen");
    expect(bucketFor("2026-09-17", "2026-09-17")).toBe("heute");
    expect(bucketFor("2026-09-18", "2026-09-17")).toBe("kommend");
  });
});

describe("parseArchive", () => {
  test("orders upcoming fireworks first, soonest to furthest out", () => {
    const parsed = parseArchive(
      archive([1, "20.09.2026 21:00:00"], [2, "18.09.2026 21:00:00"]),
      "2026-09-17",
    );

    expect(parsed.map((f) => f.id)).toEqual([2, 1]);
  });

  test("orders past fireworks after upcoming ones, most recent first", () => {
    const parsed = parseArchive(
      archive(
        [1, "01.09.2026 21:00:00"],
        [2, "10.09.2026 21:00:00"],
        [3, "18.09.2026 21:00:00"],
      ),
      "2026-09-17",
    );

    expect(parsed.map((f) => f.id)).toEqual([3, 2, 1]);
  });

  test("carries the fields the map and the info panel show", () => {
    const [firework] = parseArchive(
      archive([1, "18.09.2026 20:30:00"]),
      "2026-09-17",
    );

    expect(firework).toMatchObject({
      id: 1,
      standort: "Elbufer",
      date: "2026-09-18",
      time: "20:30",
      anlass: "Hochzeit",
      kategorie: 4,
      anzahl: 1,
      bucket: "kommend",
      coordinates: [13.74, 51.05],
    });
  });
});

describe("formatDate", () => {
  // Asserted loosely: the exact separators follow the runtime's ICU data, the
  // day must not slip for visitors west of Greenwich.
  test("renders the German weekday and date of the firework's own day", () => {
    expect(formatDate("2026-09-18")).toContain("Fr");
    expect(formatDate("2026-09-18")).toContain("18.09.2026");
  });
});

describe("matchesTimeframe", () => {
  test("treats today and announced fireworks as current", () => {
    expect(matchesTimeframe("heute", "aktuell")).toBe(true);
    expect(matchesTimeframe("kommend", "aktuell")).toBe(true);
    expect(matchesTimeframe("vergangen", "aktuell")).toBe(false);
  });

  test("keeps the archive and the full set apart", () => {
    expect(matchesTimeframe("vergangen", "vergangen")).toBe(true);
    expect(matchesTimeframe("heute", "vergangen")).toBe(false);
    expect(matchesTimeframe("vergangen", "alle")).toBe(true);
    expect(matchesTimeframe("heute", "alle")).toBe(true);
  });
});
