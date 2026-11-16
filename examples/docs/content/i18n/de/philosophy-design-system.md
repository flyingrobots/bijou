---
title: "Überblick über das Designsystem"
summary: "Die Grundlagen, Muster, Blocks und die Doktrin der Komponentenfamilien hinter Bijou UI."
---
# Das Bijou-Designsystem

Bijou hat inzwischen so viel Oberfläche, dass „hier sind die Exporte“ keine gute Dokumentationsstrategie mehr ist.

Dieser Abschnitt definiert die Designsprache hinter der Bibliothek:

- die Grundlagen, die die Oberfläche prägen
- das Token-Vokabular, das die Farbdoktrin in API-Regeln übersetzt
- die Interaktions- und Layoutmuster, die in Apps immer wiederkehren
- die Komponentenfamilien und ihre vorgesehenen Aufgaben
- die Richtlinie für Datenvisualisierung, statt jedes Mal ad hoc zu raten

Das ist bewusst näher an einem Designsystem-Leitfaden als an einer API-Referenz.

## Wofür dieser Abschnitt da ist

Nutze diese Dokumentation, wenn du Folgendes beantworten musst:

- Welches Problem löst diese Komponentenfamilie?
- Welche Variation sollte ich verwenden?
- Welche Token-Familie sollte diese Komponente verwenden?
- Wann sollte ich eine Komponente einer anderen vorziehen?
- Wann sollte ich diese Komponente ganz vermeiden?
- Gehört das in den Kern `@flyingrobots/bijou` oder in `@flyingrobots/bijou-tui`?
- Wie sollte das in den Läufen interactive, static, pipe und accessible herabgestuft werden?
- Was ist das terminalorientierte Gegenstück zu einem Designsystem-Muster für Desktop/Web?

## In dieser Reihenfolge lesen

1. [Grundlagen](./foundations.md)
2. [Vokabular der Theme-Tokens](./theme-tokens.md)
3. [Leitfaden zum Erstellen von Themes](./theme-authoring.md)
4. [Rezepte für Theme-Regeln](./theme-rule-recipes.md)
5. [Muster](./patterns.md)
6. [Blocks](./blocks.md)
7. [Richtlinie für Zeiger und Maus](./pointer.md)
8. [Komponentenfamilien](./component-families.md)
9. [Richtlinie für Datenvisualisierung](./data-visualization.md)

Das rohe Inventar und die Taxonomiearbeit hinter dieser Dokumentation findest du unter [../archive/component-system-audit.md](../archive/component-system-audit.md).

## Kernideen des Systems

### Bijou ist nicht nur eine Komponentenbibliothek

Bijou besteht aus fünf Schichten:

1. **Grundlagen**
  - Farbe, Abstandsrhythmus, Texthierarchie, Überlauf, Bewegung, Fokus, Unterbrechung
2. **Theme-Vokabular**
  - kanonische Token-Familien und Nutzungsregeln aus erster Hand
3. **Muster**
  - Status, Auswahl, Durchsuchen, Overlays, Formulare, Shell-Komposition
4. **Komponentenfamilien**
  - konkrete Primitive, die diese Muster umsetzen
5. **Blocks**
  - wiederverwendbare Baugruppen auf Produktebene wie App-Rahmen, Einstellungsabläufe und geführte Workflows

Komponenten und Blocks sollten den ersten drei Schichten nachgelagert sein. Wenn die
Designsprache schwach ist, werden Komponentenkatalog und Block-Bibliothek
unübersichtlich, egal wie viele Exporte es gibt.

### Zuständigkeit von Kern und TUI

- `@flyingrobots/bijou` ist für die Semantik zuständig, die eine Herabstufung übersteht.
- `@flyingrobots/bijou-tui` ist für Fokus, Bewegung, Overlays, Shell-Verhalten, Scrollen, Verlauf und andere lebenszyklusintensive Interaktionen zuständig.

Das bedeutet:

- `alert()` gehört in den Kern.
- `toast()` gehört in TUI.
- Benachrichtigungen gehören in TUI, weil sie ein System sind und nicht nur eine Darstellung.

### Variationen sind nicht alle gleich

Bijou verwendet drei Arten von Variation:

- **semantische Varianten**
  - zum Beispiel Statuston oder Schweregrad
- **Varianten der Interaktionsschicht**
  - zum Beispiel `accordion()` gegenüber `interactiveAccordion()`
- **Varianten des Render-Pfads**
  - zum Beispiel `box()` gegenüber `boxSurface()`

Nur die erste Art ist eine „visuelle Variante“ im üblichen Designsystem-Sinn. Die anderen beiden existieren, weil Bijou unterschiedliche Interaktions- und Rendering-Schichten überstehen muss.

### Kontrolliertes Herabstufen ist eine erstrangige Designanforderung

Jede Familie sollte beantworten:

- Wie sieht das in einem reichhaltigen interaktiven Terminal aus?
- Was bleibt in statischer CI-Ausgabe gültig?
- Was bleibt im Pipe-Modus gültig?
- Was wird im barrierefreien Modus einfacher?

Wenn eine Komponente diese Frage nicht beantworten kann, gehört sie wahrscheinlich in `@flyingrobots/bijou-tui`, nicht in den Kern.

## Dokumentationsstandard

Jede ausgereifte Seite einer Komponentenfamilie in Bijou sollte Folgendes enthalten:

- Was sie ist
- Variationen
- Wann verwenden
- Wann nicht verwenden
- Hinweise zum Inhalt
- Zuständigkeit für Interaktion
- Pfad für kontrolliertes Herabstufen
- Verwandte Familien

Der Leitfaden zu Komponentenfamilien erfüllt inzwischen diese strukturelle Grundlinie, und seine Struktur wird von einem Preflight-Skript im Repository geprüft. Dieser Preflight ist bewusst strukturell: Er prüft die erforderlichen Familienabschnitte und die Abdeckung der Modi beim kontrollierten Herabstufen innerhalb des Familienleitfadens. Semantische Genauigkeit, Abweichungen zwischen Paket- und Beispieldokumentation sowie die Vollständigkeit der Dokumentation berührter Komponenten bleiben Aufgaben des Reviews und lassen sich vom aktuellen Skript nicht automatisch nachweisen.

## Freigabe für Komponentenänderungen

Ab der Pure-Surface-Bereinigung in v4 sollte jede Änderung an einer Komponentenfamilie im selben Arbeitsschritt gegen die Dokumentation geprüft werden.

Prüfe für jede berührte Komponente oder Komponentenfamilie:

- Dokumentation existiert
- dokumentierte Varianten sind aktuell
- Hinweise unter `When to use` sind vorhanden und noch zutreffend
- Hinweise unter `When not to use` sind vorhanden und noch zutreffend
- die Zuständigkeit von Kern und TUI ist explizit
- kontrolliertes Herabstufen ist, sofern zutreffend, für `rich`, `static`, `pipe` und `accessible` dokumentiert
- verwandte Familien sind aufgeführt

Der CI-Preflight erzwingt das strukturelle Minimum für den Familienleitfaden. Wenn eine der weitergehenden Prüfungen unten fehlt oder wesentlich falsch ist, ist die Dokumentation weiterhin unvollständig, und diese Lücke sollte im selben Arbeitsschritt geschlossen oder ausdrücklich als Backlog-Schuld erfasst werden, bevor die Arbeit als erledigt gilt.

## Aktuelle Lücken, die dieser Abschnitt schließen soll

Bijou ist bereits stark in Breite und Laufzeitarchitektur. Die schwächeren Teile sind:

- explizite Nutzungshinweise
- Dokumentation auf Familienebene
- Vollständigkeit der Dokumentation gemessen am oben definierten Standard
- Entscheidungshilfen auf Musterebene
- Doktrin für Datenvisualisierung
- Richtlinie für Maus und mehrere Eingabearten

Diese Dokumentation existiert, um das zu korrigieren.
