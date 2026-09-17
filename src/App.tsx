import { useMemo, useState } from "react";
import archive from "../data/fireworks.json";
import "./App.css";
import { AboutModal } from "./components/AboutModal";
import { InfoPanel } from "./components/InfoPanel";
import { Map } from "./components/Map";
import { Panel } from "./components/Panel";
import type { FireworkArchive, Firework, Timeframe } from "./lib/fireworks";
import {
  matchesTimeframe,
  parseArchive,
  todayInDresden,
} from "./lib/fireworks";

// The archive only changes when the daily Action commits, so parsing it once at
// module scope is enough; nothing here depends on render state.
const ALL = parseArchive(
  archive as FireworkArchive,
  todayInDresden(new Date()),
);

function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>("aktuell");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flyTo, setFlyTo] = useState<{ coordinates: [number, number] } | null>(
    null,
  );
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const visible = useMemo(
    () =>
      ALL.filter((firework) => matchesTimeframe(firework.bucket, timeframe)),
    [timeframe],
  );

  const counts = useMemo(
    () =>
      ({
        aktuell: ALL.filter((f) => matchesTimeframe(f.bucket, "aktuell"))
          .length,
        vergangen: ALL.filter((f) => f.bucket === "vergangen").length,
        alle: ALL.length,
      }) satisfies Record<Timeframe, number>,
    [],
  );

  const today = useMemo(() => ALL.filter((f) => f.bucket === "heute"), []);
  const next = useMemo(
    () => ALL.find((f) => f.bucket === "kommend") ?? null,
    [],
  );

  const selected =
    visible.find((firework) => firework.id === selectedId) ?? null;

  const handleListSelect = (firework: Firework) => {
    setSelectedId(firework.id);
    // A fresh object every time, so clicking the same entry twice flies again.
    setFlyTo({ coordinates: firework.coordinates });
  };

  return (
    <div className="app">
      <Map
        fireworks={visible}
        selectedId={selectedId}
        onSelect={setSelectedId}
        flyTo={flyTo}
      />
      <Panel
        fireworks={visible}
        counts={counts}
        today={today}
        next={next}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        selectedId={selectedId}
        onSelect={handleListSelect}
        onAboutClick={() => setIsAboutOpen(true)}
      />
      <InfoPanel firework={selected} onClose={() => setSelectedId(null)} />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        total={ALL.length}
        lastUpdated={__DATA_LAST_UPDATED__}
      />
    </div>
  );
}

export default App;
