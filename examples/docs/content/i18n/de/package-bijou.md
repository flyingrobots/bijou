---
title: "@flyingrobots/bijou"
summary: "Das reine Kern-Toolkit: Prompts, Komponenten, Themes, Ports und Surface-Primitive."
---
# @flyingrobots/bijou

Der reine Kern von Bijou ohne Abhängigkeiten.

`@flyingrobots/bijou` stellt die grundlegenden Primitive für CLIs, Prompts und portable Terminalausgabe bereit. Es verwaltet Komponenten, Themes, Umgebungserkennung sowie die Kerntypen `Surface` und `LayoutNode`.

## Rolle

- **Degradation zuerst**: Automatische Moduserkennung für die Ausgabe in `interactive`, `static`, `pipe` und `accessible`.
- **Gemischter Modus**: Leistungsstarke `Surface`-Primitive für umfangreiche TUI-Apps, mit
  string-basierten Helfern für eigenständige CLI-Skripte.
- **Surface-Primitive, ohne Strings aufzugeben**: Laufzeit-Apps können auf dem
  Surface-Pfad bleiben, während CLI-orientierte Abläufe weiterhin die string-basierten Helfer nutzen.
- **Hexagonaler Kern**: Reine TypeScript-Logik, über die Ports `Runtime`, `IO` und `Style` von Plattform-IO isoliert.
