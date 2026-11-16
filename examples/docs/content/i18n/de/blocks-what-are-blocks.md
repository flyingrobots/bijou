---
title: "Was sind Blocks"
summary: "Die Design-System-Haltung für größere, meinungsstarke Bijou-Zusammenstellungen."
---
# Blocks

Dieses Dokument definiert, was Bijou unter einem wiederverwendbaren Block versteht.

Blocks sind größere, meinungsstarke Zusammenstellungen aus kanonischen Mustern und Komponenten-Familien.

## Was ein Block ist

Ein Block ist nicht:

- eine einmalige Demo-Komposition
- eine einzelne primitive Komponente
- ein Shell-spezifischer Hack, den nur eine einzige Erprobungs-Surface versteht

Ein Block ist:

- eine wiederverwendbare Zusammenstellung auf Produktebene
- aus kanonischen Mustern komponiert
- aus bestehenden Komponenten-Familien und TUI-Zuständigkeitsregeln gebaut
- mit klaren Aufgaben, Zuständigkeiten und Erwartungen an die Absenkung dokumentiert

Blocks kommen nach Doktrin, Mustern und Komponenten.

Diese Reihenfolge ist wichtig:

1. die Doktrin erklärt, wie sich gute Bijou-UX anfühlen soll
2. Muster erklären wiederkehrende Interaktionssprache
3. Komponenten-Familien liefern wiederverwendbare Primitive
4. Blocks komponieren diese Primitive zu wiederholbaren Produktstrukturen

Erscheint ein Block, bevor die ersten drei Schichten klar sind, schreibt er meist zufälligen Geschmack fest statt wiederverwendbarer Sprache.

## Was Blocks standardisieren sollten

Blocks sollten standardisieren:

- Komposition
- Struktur
- Textrhythmus
- Fokuszuständigkeit
- gängige Shell- oder Workflow-Angebote

Blocks sollten nicht verbergen:

- wichtige Interaktionszuständigkeit
- Absenkungsverhalten
- Barrierefreiheitssemantik
- Annahmen zu Lokalisierung oder Schreibrichtung

## Aktueller öffentlicher Vertrag

Bijou stellt jetzt einen metadatenorientierten Vertrag zum Erstellen von Blocks aus
`@flyingrobots/bijou` bereit:

- `BlockMetadata` deklariert Paket, Name, Familie, Maßstab, Modi, Slots,
  Varianten, Konfigurationsoptionen, komponierte Komponenten, semantische Fakten,
  Story-IDs und Dokumentation eines Blocks.
- `BlockDefinition` koppelt diese Metadaten mit einer expliziten Render-Funktion.
- `BlockPackageManifest` deklariert die exportierten Blocks, die Paketversion,
  den Bijou-Peer-Bereich, Dokumentation und Tags für die gewöhnliche Verteilung über NPM.
- `defineBlock()` und `defineBlockPackage()` validieren Definitionen, bevor
  Autorinnen und Autoren sie veröffentlichen oder indizieren.
- `defineBlock()` kann DX-034-View-Datenverträge und Befehlsabsichten für die
  Auffindbarkeit anhängen, ohne Provider-Handles oder Befehls-Callbacks.
- `appShellBlock`, `readerSurfaceBlock`, `inspectorPanelBlock`,
  `inlineStatusBlock`, `inFlowStatusBlock`, `transientOverlayBlock`,
  `activityStreamBlock`, `shortcutCueBlock`, `progressIndicatorBlock`,
  die Block-Exporte der DOGFOOD-Komponenten-Familien, `standardBlocks`,
  `standardBlockStories` und
  `standardBlockPackageManifest` stellen die First-Party-Blockdefinitionen bereit:
  AppShell, ReaderSurface, InspectorPanel, Inline-Status, In-Flow-Status,
  vorübergehendes Overlay-Feedback, Aktivitätsstrom, Tastenkürzel-Hinweise, Fortschritt,
  Gruppierung, Erklärbarkeit, Dokumente, Links, Trenner, Texteingabe, Auswahl,
  Navigation, Aufklappen, Pfadfortschritt, Markenbetonung, modusbewusste Primitive,
  dichte Vergleiche, Hierarchien, Erkundungslisten und Ansichten zeitlicher
  Abhängigkeiten.
  Ihre Render-Funktionen erzeugen jetzt deterministische erste Nachweisausgaben in den Modi
  `interactive`, `static`, `pipe` und `accessible`, während Provider-Lebenszyklus,
  Befehlsverteilung und produktives AppShell-Verhalten aus der
  Blockdefinitionsschicht herausgehalten werden.
- `defineAppShellComposition()` gruppiert laufzeitgestützte Blocks in logische
  Slots für Navigation, Inhalt, Inspektor, Status und Overlay, ohne zu rendern.
- `blockRenderNode()` und `renderBlockTree()` rendern verschachtelte
  Blockdeklarationen explizit, wenn ein Host oder eine Vorschau die Ausgabe von
  Kind-Blocks in Eltern-Slots möchte. Das gewöhnliche `block.render()` bleibt ein
  lokaler Render-Vertrag für einen einzelnen Block.
- `defineBlockSchemaAdapter()`, `defineSchemaBlock()` und
  `bindSchemaBlockInput()` validieren unbekannte Grenzdaten, bevor sie
  Render-Eingaben und Bindungsfakten für Blocks erzeugen.
- `validateBlockMetadata()`, `blockMetadataSummary()` und Bericht-Hilfsfunktionen geben
  Tests, Dokumentation, DOGFOOD, MCP-Payloads und Agenten einen deterministischen Weg,
  Blockfakten zu prüfen, ohne eine Terminal-Surface zu rendern.

Blocks werden beschrieben, bevor sie rendern, Paketautorinnen und -autoren vermeiden
versteckte globale Registrierung, und Werkzeuge können Slots und Modusunterstützung
direkt entdecken. Schemagebundene Blocks validieren unbekannte Grenzdaten, ohne Zod,
GraphQL oder Datenbankschemas zum Teil der Kern-Abhängigkeitsfläche von Blocks zu machen.
Provider-Abonnements, aktive Hierarchietraversierung, gerenderte AppShell und
DOGFOOD-Block-Aufnahmen in mehreren Modi bleiben Folgearbeit.

## Erste glaubwürdige Block-Kandidaten

### App-Rahmen

Die gerahmte Shell ist bereits eine der stärksten wiederkehrenden Strukturen von Bijou.

Als künftiger Block sollte `App frame` standardisieren:

- Fensterrhythmus
- Behandlung der aktiven Region
- Zuständigkeit für Shell-Kopf- und -Fußzeile
- Shell-Overlays wie Einstellungen und Hilfe

### Einstellungsschublade

Die Einstellungsschublade ist ein glaubwürdiger künftiger Block, weil sie bereits Folgendes hat:

- kanonische Präferenzzeilen
- Shell-eigenes Schließ- und Auffindungsverhalten
- stabilen Abschnittsrhythmus
- wahrheitsgetreue Behandlung der aktiven Zeile

Als Block sollte sie wiederverwendbar sein, ohne von DOGFOOD-spezifischem Code abzuhängen.

### Benachrichtigungszentrale

Die Benachrichtigungszentrale ist ein wahrscheinlicher künftiger Block, sobald die Arbeit am Humane Terminal wieder aufgenommen wird.

Sie sollte schließlich standardisieren:

- Hinweiszeilen
- Archiv- und Verlaufsdurchsicht
- Filterrhythmus
- Shell-eigenes Verhalten für Unterbrechung gegenüber Durchsicht

### Geführter Ablauf

Der geführte Ablauf ist die allgemeine Block-Familie für:

- Onboarding
- Einrichtungssequenzen
- Erklärbarkeits-Rundgänge
- mehrstufige unterstützte Abläufe

Er sollte Folgendes komponieren:

- Präferenzzeilen
- Warnungen und Notizen
- Stepper- oder Zeitleistensprache
- explizite nächste Aktionen

DL-005 beweist die erste kanonische Nahtstelle dieser Familie durch `explainability()`, das die KI-Erklärbarkeitsdoktrin in eine strukturierte Surface für geführte Abläufe verwandelt, statt sie nur als Prosa zu belassen.
DL-008 befördert die wiederverwendbare Block-Nahtstelle durch `guidedFlow()`, das ruhigere mehrstufige Unterstützung, Abschnittsrhythmus und die Behandlung nächster Aktionen standardisiert, ohne jede geführte Surface zu zwingen, sich als KI-Erklärbarkeit auszugeben.

### Inspektor-Panel

Ein Seitenpanel im Inspektor-Stil ist ein weiterer starker Kandidat, weil es auf natürliche Weise Folgendes vereint:

- betitelte Abschnitte
- unterstützenden Text
- Betonung des aktuellen Werts
- kompakte, aber ruhige Abstände

DL-006 beweist jetzt die erste kanonische Nahtstelle dieser Familie durch `inspector()`, das den Rhythmus von Inspektor-Panels in eine wiederverwendbare Kernkomponente verwandelt, statt ihn in einer maßgeschneiderten DOGFOOD-Detailbox gefangen zu halten.
DL-007 befördert die erste Nahtstelle auf Blockebene in dieser Familie durch `inspectorDrawer()`, das die an Schubladen angehängte Inspektor-Komposition in TUI-Shells standardisiert, statt bestehende Inspektor-Schubladen Strings von Hand zusammensetzen zu lassen.

## Abnahmekriterien für Blocks

Eine Struktur ist bereit, ein kanonischer Block zu werden, wenn:

- sie über mehr als eine Surface oder einen Produktbedarf hinweg wiederkehrt
- ihre Interaktionszuständigkeit stabil ist
- ihre Muster anderswo bereits kanonisch sind
- ihre Absenkungsgeschichte explizit ist
- sie Wiederverwendung verbessert, statt mehr Qualität in einer einzigen Shell einzuschließen

## Was du nicht tun solltest

- befördere nicht jede hübsche Demo zu einem Block
- lass Blocks kanonische Muster nicht umgehen
- lass Blocks nicht zu Speicher-, Dienst- oder App-Domänenannahmen werden
- behandle Blocks nicht als den ersten Ort, an dem Barrierefreiheit oder Lokalisierung bedacht wird

## Bezug zum aktuellen Zyklus

DL-002 implementiert keine Blocks-Laufzeit.

Dieser Zyklus dient dazu, die Block-Schicht explizit zu machen, damit künftige Zyklen echte wiederkehrende Strukturen bewusst statt zufällig befördern können.
