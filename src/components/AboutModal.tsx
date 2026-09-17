interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  lastUpdated: string | null;
}

export function AboutModal({
  isOpen,
  onClose,
  total,
  lastUpdated,
}: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Schließen"
        >
          ×
        </button>

        <h1>Über das Projekt</h1>

        <p>
          Das hier ist ein Projekt von <a href="https://kilian.io">Kilian</a>.
          Es zeigt, wo in Dresden Mittel- und Großfeuerwerke angezeigt sind,
          damit man beim nächsten Knall nicht rätseln muss, woher er kam.
        </p>

        <p>
          Feuerwerke der Kategorien 3 und 4 dürfen nur von Fachleuten abgebrannt
          werden und müssen der Stadt zwei Wochen vorher angezeigt werden.
          Genehmigt werden sie nicht, die Stadt nimmt sie nur zur Kenntnis.
          Silvesterböller und anderes Kleinfeuerwerk der Kategorie 2 tauchen
          hier also nicht auf.
        </p>

        <p>
          Die Daten kommen aus dem{" "}
          <a href="https://opendata.dresden.de">OpenData-Portal</a> der Stadt
          Dresden, aus dem Datensatz{" "}
          <a href="https://opendata.dresden.de/informationsportal/?open=1&result=91AFB448529C48EE98119DA25AF474D6#app/mainpage////">
            Feuerwerke, aktuelle Mittel- und Großfeuerwerke
          </a>
          . Die Stadt zeigt jedes Feuerwerk nur bis zwei Wochen danach an,
          deshalb sammelt dieses Projekt sie täglich ein und behält sie.
        </p>

        <p>
          Kartendaten werden freundlicherweise von{" "}
          <a href="https://openfreemap.org/">OpenFreeMap</a> bereitgestellt,
          dankeschön! 🫶
        </p>

        <p>
          Der Quelltext der Seite liegt auf{" "}
          <a href="https://github.com/kiliankoe/woknallts">GitHub</a>.
        </p>

        <div className="modal-stats">
          <p>{total} Feuerwerke im Archiv</p>
          {lastUpdated && (
            <p>
              Stand:{" "}
              {new Date(lastUpdated).toLocaleDateString("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
