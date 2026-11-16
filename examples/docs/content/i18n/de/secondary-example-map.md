---
title: "Übersicht der sekundären Beispiele"
summary: "Warum Beispiele jetzt sekundär/intern sind und welchen Referenzwert sie noch behalten."
---
# Übersicht der sekundären Beispiele

Diese Datei ist kein riesiges Statusbuch pro Beispiel mehr.

Sie ist eine Referenzübersicht für Maintainer und Agenten, kein öffentlicher
Dokumentations-Hub.

DOGFOOD ist die primäre lebende Dokumentation und Erprobungs-Surface. In v4.4.0
wurden 31 Beispiele ausgemustert, weil DOGFOOD ihre Komponenten-Familien jetzt direkt
abdeckt. Die übrigen Beispiele existieren als Referenzen für Laufzeitnahtstellen, zur
Erprobung der Shell und als Demos von Blatt-APIs, die DOGFOOD noch nicht lehrt.

Wenn du Bijou lernen willst, beginne mit [DOGFOOD](./DOGFOOD.md),
nicht mit dieser Datei.

Für das vollständige sekundäre/interne Inventar nutze
[../examples/README.md](../examples/README.md).

## Behalten

Diese Beispiele haben weiterhin einen klaren sekundären bzw. Referenzwert.

### Laufzeitreferenzen

Behalte diese als zentrale Laufzeitreferenzen für die Linie `v4.0.0`:

- `examples/v3-demo`
- `examples/v3-css`
- `examples/v3-motion`
- `examples/v3-subapp`
- `examples/v3-worker`
- `examples/v3-pipeline`

Sie tragen weiterhin die historischen `v3-*`-Namen, bleiben aber die klarsten Referenzen für Laufzeitnahtstellen auf diesem Branch.

### DOGFOOD und Erprobungs-Surfaces für die Shell

Behalte diese, weil sie Verhalten auf Produktebene belegen statt isoliertes Rendern einzelner Blätter:

- `examples/docs`
  - die lebende Dokumentations-App und aktuelle Erprobungs-Surface
- `examples/release-workbench`
  - kanonische Kontrollraum-Shell mit mehreren Ansichten
- `examples/notifications`
  - Benachrichtigungsstapel, Routing, Verlauf und Review-Verhalten der Shell
- `examples/app-frame`
  - Referenz für gerahmte Shells

### Verbleibende Blattbeispiele

Behalte Blattbeispiele, wenn sie die klarste isolierte Erklärung einer Familie oder
API-Nahtstelle sind, die noch nicht durch DOGFOOD-Stories abgedeckt ist. Der
verbleibende Satz in dieser Datei ist die aktuelle Referenz für Ausmusterungen von
Beispielen, die noch von tieferer DOGFOOD-Lehre abhängen. Die historische Folgearbeit
zur Tiefe ist [DF-020](./method/retro/DF-020-deepen-dogfood-story-depth-and-variant-quality.md).

## Später streichen

Ein Beispiel wird erst dann zum Ausmusterungskandidaten, wenn alle folgenden Punkte zutreffen:

1. DOGFOOD oder ein anderes kanonisches Szenario lehrt jetzt dieselbe Entscheidung klar.
2. Kein Migrationsleitfaden und keine Paket-README verweist noch auf das Beispiel.
3. Es trägt keinen einzigartigen Smoke- oder Regressionswert.
4. Es ist nicht der klarste isolierte Nachweis einer öffentlichen API-Nahtstelle.

## Bezug zum Release-Smoke

Der Release-Smoke läuft jetzt über `smoke:dogfood`.

Verfolgter Abschluss:

- [WF-003 — `smoke:examples:*` durch `smoke:dogfood` ersetzen](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

Das bedeutet, dass Beispiele nicht mehr der releaseseitige Smoke-Vertrag sind, auch
wenn noch interne Referenzwerkzeuge rund um Beispielszenarien existieren.
