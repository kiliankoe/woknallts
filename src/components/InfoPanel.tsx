import type { Firework } from "../lib/fireworks";
import { BUCKET_COLORS, BUCKET_LABELS, formatDate } from "../lib/fireworks";

interface InfoPanelProps {
  firework: Firework | null;
  onClose: () => void;
}

export function InfoPanel({ firework, onClose }: InfoPanelProps) {
  if (!firework) return null;

  return (
    <div className="info-panel">
      <button
        className="info-panel-close"
        onClick={onClose}
        aria-label="Schließen"
      >
        ×
      </button>

      <h2 className="info-panel-title">
        {formatDate(firework.date)}, {firework.time} Uhr
      </h2>
      <p className="info-panel-subtitle">{firework.standort}</p>

      <p className="info-panel-anlass">Anlass: {firework.anlass}</p>

      <div className="info-panel-meta">
        <span
          className="info-panel-badge"
          style={{ backgroundColor: BUCKET_COLORS[firework.bucket] }}
        >
          {BUCKET_LABELS[firework.bucket]}
        </span>
        <span className="info-panel-tag">Kategorie {firework.kategorie}</span>
        {firework.anzahl > 1 && (
          <span className="info-panel-tag">{firework.anzahl} Feuerwerke</span>
        )}
        <span className="info-panel-tag">{firework.art}</span>
      </div>
    </div>
  );
}
