---
title: "Paketübersicht"
summary: "Wie die öffentlichen Workspace-Pakete im Bijou-Stack zusammenspielen."
---
# Pakete

Dieser Abschnitt ist der Paketleitfaden für Bijous veröffentlichten Workspace.

## Aktuelle Paketübersicht

- `@flyingrobots/bijou` — Kern-Surfaces, Tokens, Layout-Hilfen und Komponenten
- `@flyingrobots/bijou-node` — Node-Adapter für Laufzeit und Styling
- `@flyingrobots/bijou-tui` — gerahmte Shell und Laufzeit für Terminal-Apps
- `@flyingrobots/bijou-tui-app` — App-Hilfen und Shell-Gerüst
- `create-bijou-tui-app` — Projektvorlage und Einstiegs-Workflow
- `@flyingrobots/bijou-i18n*` — Lokalisierungslaufzeit, Werkzeuge und Adapter
- `@flyingrobots/bijou-mcp` — Rendern von Komponenten und semantische Daten für MCP-Clients

## So nutzt du diesen Abschnitt

- öffne im linken Fenster das Paket, das dich interessiert
- lies im mittleren Fenster die Rolle des Pakets und den Surface-Leitfaden
- nutze das rechte Fenster für eine kurze Zusammenfassung, wofür die Seite gedacht ist

Die Paketseiten in diesem Abschnitt werden aus der echten Workspace-Dokumentation des
Repos veröffentlicht, damit DOGFOOD wie ein richtiger Paketleitfaden funktioniert statt
nur als Platzhalter-Startseite.

Das TUI-Paket verantwortet die unveränderliche Raster-Font-API. Font-Dekodierung,
Google-Fonts-Downloads und Typografie-Steuerung pro Element leben im Markdown-Beispiel;
sie sind keine automatischen TTF-Ladefunktionen des reinen Renderers. Siehe
**Leitfäden → Neueste Funktionen** und `examples/markdown-font/README.md`.
