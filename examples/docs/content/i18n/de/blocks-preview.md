---
title: "Block-Vorschau"
summary: "Ein codegestützter Vorschauindex für Standard-Blocks, Varianten und deklarierte Stories."
---
# Block-Vorschau

Wähle in der seitlichen Navigation einen Block, um sein Live-TUI-Beispiel, die Absenkungsvorschau und die Dokumentation zu sehen. Die Übersicht hält das Paketinventar lesbar, ohne jeden Block auf einmal zu rendern.

## Verfügbare Blocks

## AppShell

Komponiert logische App-Regionen für Navigation, Inhalt, Inspektion, Status und Overlays.

Varianten: wide (Breit), narrow (Schmal)

Stories:
- app-shell.ready - Shell bereit - ready
- app-shell.narrow - Schmale Shell - narrow
- app-shell.overlay - Shell mit Overlay - overlay

## ReaderSurface

Komponiert lesbaren Inhalt mit optionalem Navigations- und Gliederungskontext.

Varianten: article (Artikel), loading (Lädt)

Stories:
- reader-surface.ready - Reader bereit - ready
- reader-surface.loading - Reader lädt - loading
- reader-surface.stale - Reader veraltet - stale
- reader-surface.empty - Reader leer - empty
- reader-surface.error - Reader-Fehler - error

## InspectorPanel

Erklärt die aktuelle Auswahl mit optionalen Fakten und Quellaktionen.

Varianten: selection (Auswahl), empty (Leer)

Stories:
- inspector-panel.ready - Inspektor bereit - ready
- inspector-panel.empty - Inspektor leer - empty
- inspector-panel.loading - Inspektor lädt - loading
- inspector-panel.stale - Inspektor veraltet - stale
- inspector-panel.error - Inspektor-Fehler - error

## InlineStatusBlock

Hängt knappe Statusfakten an Beschriftungen, Zeilen und Befehlshinweise, ohne sich auf rein farbliche Bedeutung zu verlassen.

Varianten: ready (Bereit)

Stories:
- inline-status.ready - Inline-Status bereit - ready

## InFlowStatusBlock

Zeigt dauerhafte Statusmeldungen im Fluss mit Schweregrad, Quelle, Aktion und Fakten für niedrigere Modi.

Varianten: ready (Bereit)

Stories:
- in-flow-status.ready - In-Flow-Status bereit - ready

## TransientOverlayBlock

Kündigt kurzlebigen Zustand mit Priorität, Schließen und barrierefreien Textfakten an.

Varianten: ready (Bereit)

Stories:
- transient-overlay.ready - Vorübergehendes Overlay bereit - ready

## ActivityStreamBlock

Rendert chronologische Ereignisse mit Fakten zum ausgewählten Ereignis und für niedrigere Modi.

Varianten: ready (Bereit)

Stories:
- activity-stream.ready - Aktivitätsstrom bereit - ready

## ShortcutCueBlock

Rendert Inline-Tastenkürzelhinweise mit Taste, Aktion, Geltungsbereich und Semantik für niedrigere Modi.

Varianten: ready (Bereit)

Stories:
- shortcut-cue.ready - Tastenkürzel-Hinweis bereit - ready

## ProgressIndicatorBlock

Stellt Fortschrittsbeschriftung, Wert, Gesamtwert, Prozent und Fortschrittsfakten für niedrigere Modi bereit.

Varianten: ready (Bereit)

Stories:
- progress-indicator.ready - Fortschrittsanzeige bereit - ready

## FramedGroupBlock

Gruppiert zusammengehörigen Inhalt in einer gerahmten Region mit Titel, ausgewähltem Element und Gruppierungsfakten für niedrigere Modi.

Varianten: ready (Bereit)

Stories:
- framed-group.ready - Gerahmte Gruppe bereit - ready

## ExplainabilityWalkthroughBlock

Erklärt, warum sich ein Zustand geändert hat, mit geordneten Schritten, Belegen, Entscheidung und Fakten zur nächsten Aktion.

Varianten: ready (Bereit)

Stories:
- explainability-walkthrough.ready - Erklärbarkeits-Rundgang bereit - ready

## FormattedDocumentBlock

Veröffentlicht dauerhafte Prosa mit Überschrift, Fließtext, Hervorhebung und Codefakten, die niedrigere Modi überstehen.

Varianten: ready (Bereit)

Stories:
- formatted-document.ready - Formatiertes Dokument bereit - ready

## LinkDestinationBlock

Beschreibt ein navigierbares Ziel mit Beschriftung, Ziel, Art, Status und Linkfakten für niedrigere Modi.

Varianten: ready (Bereit)

Stories:
- link-destination.ready - Linkziel bereit - ready

## DividerBlock

Trennt Abschnitte mit einer beschrifteten strukturellen Linie, die in den Modi `pipe` und `accessible` bedeutungsvoll bleibt.

Varianten: ready (Bereit)

Stories:
- divider.ready - Trenner bereit - ready

## TextEntryBlock

Beschreibt einen Texteingabezustand mit Feld, Wert, Platzhalter, Validierung und Ergebnisfakten.

Varianten: ready (Bereit)

Stories:
- text-entry.ready - Texteingabe bereit - ready

## SingleChoiceBlock

Beschreibt ein Einzelauswahl-Steuerelement mit Optionsliste, ausgewähltem Wert, Modus und Validierungsfakten.

Varianten: ready (Bereit)

Stories:
- single-choice.ready - Einzelauswahl bereit - ready

## MultipleChoiceBlock

Beschreibt eine Checkliste mit angehakten und nicht angehakten Einträgen, Auswahlzusammenfassung und Validierungsfakten.

Varianten: ready (Bereit)

Stories:
- multiple-choice.ready - Mehrfachauswahl bereit - ready

## BinaryDecisionBlock

Beschreibt eine Ja/Nein-Entscheidung mit gewählter Seite, Konsequenz, Bestätigung und Fakten zum Deaktivierungsgrund.

Varianten: ready (Bereit)

Stories:
- binary-decision.ready - Binäre Entscheidung bereit - ready

## PeerNavigationBlock

Beschreibt Navigation zwischen Geschwistern mit vorherigem, aktuellem und nächstem Eintrag, Route und Verfügbarkeitsfakten.

Varianten: ready (Bereit)

Stories:
- peer-navigation.ready - Geschwisternavigation bereit - ready

## ProgressiveDisclosureBlock

Beschreibt aufklappbaren Inhalt mit Aufklappzustand, Anzahl verborgener Einträge, Zusammenfassung und Details.

Varianten: ready (Bereit)

Stories:
- progressive-disclosure.ready - Schrittweises Aufklappen bereit - ready

## PathProgressBlock

Beschreibt Breadcrumb- und Schrittfortschritt mit Pfad, aktuellem Schritt, Ordinalzahl, Gesamtzahl und Statusfakten.

Varianten: ready (Bereit)

Stories:
- path-progress.ready - Pfadfortschritt bereit - ready

## BrandEmphasisBlock

Beschreibt Marken- und dekorative Betonung mit expliziter Semantik für nicht wesentliche Dekoration.

Varianten: ready (Bereit)

Stories:
- brand-emphasis.ready - Markenbetonung bereit - ready

## ModeAwarePrimitiveBlock

Erfasst die Ausgabe eigener Primitive mit expliziten Modusverträgen und Fakt-/Wert-Semantik.

Varianten: ready (Bereit)

Stories:
- mode-aware-primitive.ready - Modusbewusstes Primitiv bereit - ready

## DenseComparisonBlock

Veröffentlicht dichte Vergleichszeilen mit Metrik, linkem Wert, rechtem Wert, Differenz und Fakten zur ausgewählten Zeile.

Varianten: ready (Bereit)

Stories:
- dense-comparison.ready - Dichter Vergleich bereit - ready

## HierarchyBlock

Beschreibt Baumzustand mit Wurzel, Knoten, ausgewähltem Knoten, Elternknoten, Tiefe und Aufklappfakten.

Varianten: ready (Bereit)

Stories:
- hierarchy.ready - Hierarchie bereit - ready

## ExplorationListBlock

Kombiniert Titel, Facette, Elemente, ausgewähltes Element und Vorschaudetail zu einem Block zum Durchstöbern.

Varianten: ready (Bereit)

Stories:
- exploration-list.ready - Erkundungsliste bereit - ready

## TemporalDependencyBlock

Zeigt Zeitleisten- und Abhängigkeitsfakten mit Reihenfolge, ausgewähltem Ereignis und „hängt ab von“-Semantik.

Varianten: ready (Bereit)

Stories:
- temporal-dependency.ready - Zeitliche Abhängigkeit bereit - ready
