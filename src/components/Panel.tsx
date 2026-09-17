import { useState } from "react";
import type { Firework, Timeframe } from "../lib/fireworks";
import {
  BUCKET_COLORS,
  BUCKET_LABELS,
  formatDate,
  TIMEFRAME_LABELS,
} from "../lib/fireworks";

interface PanelProps {
  fireworks: Firework[];
  counts: Record<Timeframe, number>;
  today: Firework[];
  next: Firework | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  selectedId: number | null;
  onSelect: (firework: Firework) => void;
  onAboutClick: () => void;
}

const TIMEFRAMES: Timeframe[] = ["aktuell", "vergangen", "alle"];

const getInitialExpandedState = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 768px)").matches;
};

function Headline({
  today,
  next,
}: {
  today: Firework[];
  next: Firework | null;
}) {
  if (today.length > 0) {
    const times = today.map((firework) => firework.time).join(", ");
    return (
      <div className="headline headline-loud">
        <strong>
          Heute knallt&apos;s {today.length > 1 ? `${today.length}×` : ""}
        </strong>
        <span>um {times} Uhr</span>
      </div>
    );
  }

  return (
    <div className="headline">
      <strong>Heute ist Ruhe</strong>
      <span>
        {next
          ? `Als Nächstes am ${formatDate(next.date)} um ${next.time} Uhr`
          : "Zur Zeit ist kein Feuerwerk angezeigt."}
      </span>
    </div>
  );
}

export function Panel({
  fireworks,
  counts,
  today,
  next,
  timeframe,
  onTimeframeChange,
  selectedId,
  onSelect,
  onAboutClick,
}: PanelProps) {
  const [isExpanded, setIsExpanded] = useState(getInitialExpandedState);

  return (
    <div className={`panel ${isExpanded ? "expanded" : "collapsed"}`}>
      <button
        className="panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Panel einklappen" : "Panel ausklappen"}
      >
        <span className="panel-title">woknallts</span>
        <span className="panel-icon">{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div className="panel-content">
          <section className="panel-section">
            <Headline today={today} next={next} />
          </section>

          <section className="panel-section">
            <h3>Zeitraum</h3>
            <div className="panel-options">
              {TIMEFRAMES.map((key) => (
                <label key={key} className="panel-option">
                  <input
                    type="radio"
                    name="timeframe"
                    checked={timeframe === key}
                    onChange={() => onTimeframeChange(key)}
                  />
                  <span>
                    {TIMEFRAME_LABELS[key]}{" "}
                    <span className="count">({counts[key]})</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="panel-section">
            {fireworks.length === 0 ? (
              <p className="panel-empty">Hier ist gerade nichts zu sehen.</p>
            ) : (
              <ul className="firework-list">
                {fireworks.map((firework) => (
                  <li key={firework.id}>
                    <button
                      className={`firework-item${selectedId === firework.id ? " selected" : ""}`}
                      onClick={() => onSelect(firework)}
                    >
                      <span
                        className="color-indicator"
                        style={{
                          backgroundColor: BUCKET_COLORS[firework.bucket],
                        }}
                        title={BUCKET_LABELS[firework.bucket]}
                      />
                      <span className="firework-item-text">
                        <span className="firework-item-when">
                          {formatDate(firework.date)}, {firework.time} Uhr
                        </span>
                        <span className="firework-item-where">
                          {firework.standort}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel-section">
            <button className="about-button" onClick={onAboutClick}>
              Über das Projekt
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
