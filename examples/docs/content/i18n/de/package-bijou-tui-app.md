---
title: "@flyingrobots/bijou-tui-app"
summary: "Der meinungsstarke Starter mit gerahmter Shell für Bijou-Vollbild-Apps mit Tabs."
---
# `@flyingrobots/bijou-tui-app`

TUI-App-Gerüst mit allem Nötigen, aufgebaut auf `createFramedApp()`.

## Rolle des Pakets

- **Reiner Shell-Vertrag** — gerahmte Fenster bleiben jetzt auf dem Surface-/Layout-Pfad. Shell-Fenster rendern `Surface` oder `LayoutNode`, keine String-Ansichten.
- **Ehrliche Shell-Rolle** — dieses Paket ist die meinungsstarke Shell-Schicht im Bijou-Stack, nicht die gesamte Laufzeit. Nutze es, wenn du Tabs, Footer-/Hilfe-Chrome, Overlays und einen sofort lauffähigen App-Rahmen willst.
- **Kanonischer Release-Starter** — der Scaffolder und die aktuellen Laufzeitreferenzen behandeln dieses Paket als Standardweg, eine ausgefeilte Bijou-Vollbild-App aufzusetzen.

Es liefert eine sofort lauffähige Shell mit vernünftigen Standards:
- gerahmte Vollbild-App-Shell
- obere Tab-Leiste (`|`-Trenner, Hintergründe für aktive/inaktive Tabs)
- animierter Zusatz-Drawer im ersten Tab (`o` schaltet um)
- Seitenwechsel über `[` und `]`
- Beenden-Bestätigungsdialog bei `q` und `ctrl+c`
- zweizeiliger Footer: Statuszeile über der Steuerungszeile
- `\`-Trennzeile über die volle Breite oberhalb des Footers
- standardmäßig zwei Tabs:
  - Tab 1: Hauptfenster + Zusatz-Drawer
  - Tab 2: horizontale Teilung für Vergleichs-/Inspektionsabläufe

## Wann du es verwenden solltest

Verwende `@flyingrobots/bijou-tui-app`, wenn:
- deine App gleichrangige Ziele hat, die in Tabs gehören
- du standardisiertes Shell-Chrome, Hilfe, Status und Befehlssuche willst
- Nebenarbeit in einem Drawer leben soll, statt den ganzen Bildschirm einzunehmen
- destruktives Beenden oder Prüfabläufe über einen modalen Dialog laufen sollen

Vermeide es, wenn:
- du einen einmaligen CLI- oder Prompt-Ablauf baust
- die Oberfläche im Grunde ein einzelnes Dokument ist und kein Shell-Chrome braucht
- du eine vollständig eigene Shell willst, statt Bijous meinungsstarken Starter zu übernehmen

## Rolle im Designsystem

Der Starter ist bewusst meinungsstark:
- Tabs sind für gleichrangige Ziele
- der Drawer ist für ergänzende Nebenarbeit, Filter, Inspektion und Kontext
- der Beenden-Dialog ist für blockierende Bestätigungen
- die Footer-Zeilen sind Shell-Chrome, kein Seiteninhalt
- die geteilte Seite demonstriert Vergleichs- und Sekundärkontext-Layouts, keinen beliebigen Füllinhalt
