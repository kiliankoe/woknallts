# woknallts

[woknallts.dresden.lol](https://woknallts.dresden.lol) zeigt auf einer Karte, wo in Dresden Feuerwerke angezeigt sind. Wenn es knallt, lässt sich hier nachsehen, woher.

Die Daten kommen aus dem [OpenData-Portal](https://opendata.dresden.de) der Stadt Dresden, aus dem Datensatz "Feuerwerke, aktuelle Mittel- und Großfeuerwerke".

## Archiv

Die Stadt veröffentlicht nur, was angezeigt ist, plus die letzten zwei Wochen. Jedes Feuerwerk verschwindet vierzehn Tage nach dem Abbrennen aus dem Datensatz. `scripts/archive-fireworks.ts` archiviert die Datensätze im Repo. So lässt sich auch später noch nachsehen, wo es in Dresden schon geknallt hat.

## Entwicklung

```bash
bun install
bun run dev
bun test
bun run lint
bun run format
bun run build
```
