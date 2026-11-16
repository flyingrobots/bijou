---
title: "Architektur"
summary: "Die strukturelle Referenz für den Workspace aus neun Paketen und seine Kern-, Laufzeit- und i18n-Spuren."
---
# ARCHITEKTUR

Dies ist der kurze Architekturwegweiser für die Dokumentations-Surface.

Bijou ist ein Monorepo aus neun Paketen für Terminal-Software in TypeScript. Die
[ARCHITECTURE.md](../ARCHITECTURE.md) im Wurzelverzeichnis ist der Haupteinstieg, aber
DOGFOOD und die Dokumentationsspur brauchen hier trotzdem eine repo-eigene Zusammenfassung.

## Struktur

- `@flyingrobots/bijou` verantwortet den reinen Kern: Prompts, Themes, Komponenten und
  Surfaces
- `@flyingrobots/bijou-tui` verantwortet die Vollbild-Laufzeit, Layout, Bewegung,
  Overlays und die gerahmte Shell
- `@flyingrobots/bijou-node` verantwortet die Terminal-/Prozessgrenze, die
  Worker-Laufzeit und den Recorder
- die i18n-Pakete verantworten Laufzeitkataloge sowie Workflows zum Erstellen und
  Austauschen von Lokalisierungen

## Weiterlesen

- [Architekturwegweiser im Wurzelverzeichnis](../ARCHITECTURE.md)
- [Laufzeitarchitektur](../packages/bijou-tui/ARCHITECTURE.md)
- [Node-Architektur](../packages/bijou-node/ARCHITECTURE.md)
- [Kernarchitektur](../packages/bijou/ARCHITECTURE.md)
