---
title: "Was ist neu in v8.0.0"
summary: "Die ausführliche Release-Geschichte der Linie 8.0.0."
---
# Was ist neu in Bijou 8.0.0-rc.1

Ein Release Candidate, veröffentlicht, damit die folgenden Breaking Changes an
echten Anwendungen validiert werden können, bevor `8.0.0` erscheint. Pinne die exakte
Version; das Dist-Tag ist `next`, nicht `latest`.

## Die Schlagzeile ist eine Löschung

`detectOutputMode()` beachtet `NO_COLOR` nicht mehr.

Diese Variable bedeutet genau eines: Schick mir keine Farbe. Sie hat nie „zeichne keine
Benutzeroberfläche“ bedeutet. Bijou las sie als Fähigkeitssignal, sodass eine
Entwicklerin mit `NO_COLOR=1` im Shell-Profil keine monochrome TUI bekam, sondern gar
keine TUI. Jede Komponente fiel auf ihre Einzelbild-Form zurück, und die
Beenden-Bestätigung hörte auf zu fragen.

Das verräterische Zeichen war, dass zwei First-Party-Konsumenten unabhängig
voneinander jeweils einen eigenen Detektor geschrieben hatten, um das zu umgehen.
`git-cas` liefert ein `detectCliTuiMode` mit einem Kommentar, der das Problem erklärt;
`muniment` schrieb dieselbe Überschreibung aus demselben Grund. Wenn Konsumenten deinen
Detektor neu implementieren, beantwortet der Detektor eine Frage, die sie nicht
gestellt haben.

Farbe ist nicht betroffen – sie war in der Implementierung nie an den Modus gekoppelt,
nur im Detektor. `NO_COLOR` wird an drei Stellen unabhängig gelesen, von denen keine
`ctx.mode` befragt; ist die Variable gesetzt, bekommst du also weiterhin
`theme.noColor === true` und ungestylte Ausgabe. Was du jetzt zusätzlich bekommst, ist
eine funktionierende TUI.

Der Test dafür hat eine Form, die es wert ist, kopiert zu werden. Statt festzustellen,
welchen Modus `NO_COLOR` erzeugt, prüft die Eigenschaft, dass das Hinzufügen von
`NO_COLOR` zu *irgendeiner* Umgebung den Modus dieser Umgebung unverändert lässt – der
Vertrag direkt formuliert, über 200 generierte Kombinationen aus Wert, TTY-Zustand,
`CI` und `TERM`.

## Ein unbekannter Statusschlüssel sieht nicht mehr abgebrochen aus

`ctx.status('typo')` fiel früher auf `status.muted` zurück, und `status.muted` trägt in
jedem mitgelieferten Preset `strikethrough`. Ein vertippter Schlüssel – oder einer, den
eine Anwendung definieren wollte, aber nicht definiert hat – renderte also
durchgestrichenen Text. Die Leserin sieht „abgebrochen“. Die Anwendung hat das nie
gesagt.

Jetzt fällt er auf `semantic.muted` zurück, das gedimmt ist und sonst nichts – passend
zu dem, was der verwandte `ui()`-Accessor mit `semantic.primary` bereits tat.

Dieser Fall stammt aus einer echten Anwendung, die den Fehler ausgeliefert hat: Ein
Painter wurde deklariert, sein Statusschlüssel später als Duplikat aus dem Theme
entfernt, und der Painter löste weiter auf den Fallback auf. Nichts fing das ab – weder
der Typprüfer noch ein Paletten-Audit noch ein Review –, weil noch keine View ihn
aufgerufen hatte.
[#521](https://github.com/flyingrobots/bijou/issues/521) verfolgt die Typisierung der
Accessoren, damit daraus ein Kompilierfehler wird.

## `extendTheme()` erreicht endlich jede Gruppe

`Theme` hat sechs Token-Gruppen. `extendTheme()` akzeptierte Erweiterungen für vier,
was nach einem Versehen klingt und sich wie eine Falle verhält, weil die mitgelieferten
Presets eine Farbe über die Gruppen hinweg verwenden, die du nicht erreichen konntest.

`bijou-dark` malt `status.warning`, `status.active`, `semantic.warning`,
`semantic.accent`, `ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`,
`border.secondary` und `border.warning` in einem einzigen Bernsteinton. Zehn Tokens.
`extendTheme(BIJOU_DARK, { status })` gab dir also deine Status und ließ diesen
Bernsteinton jede Überschrift, jeden Cursor und jeden Rahmen beherrschen – und war einer
deiner neuen Status ebenfalls bernsteinähnlich, wurden deine Überschriften von deinen
Warnungen ununterscheidbar. So wurde das gefunden, bei ΔE 0.023 in OKLab.

`border` und `semantic` sind jetzt erreichbar. Sie sind überschreibbar statt
erweiterbar, da `Theme` ihre Schlüsselmengen festlegt.

Der Alias selbst ist noch da. `extendTheme()` macht ihn umgehbar, nicht behoben –
siehe [#519](https://github.com/flyingrobots/bijou/issues/519), das auch festhält, dass
`error` und `success` unter Protanopie im dunklen Preset auf ΔE 0.059 und im hellen auf
0.064 zusammenfallen und dass die Schweregradleiter von `bijou-light` in der Helligkeit
umgekehrt ist. Wenn du dich darauf verlässt, dass die mitgelieferten Presets
Schweregrade unterscheiden, lies dieses Issue.

## Außerdem in diesem Candidate

Alles, was sich seit `7.2.0` auf `main` angesammelt hat:

- **Terminal-Inspektion für Profunctor Page** – `lowerProfunctorPageArtifacts()`
  validiert die kanonische Familie `profunctor-page/0` und gibt deterministische
  Szenen-IR, Surfaces, Zielkarten, Belege, Zellen-Source-Maps und Textnachweise über
  sechs Inspektionsmodi aus, wobei nicht unterstützte Browsersemantik als explizite
  Fähigkeitsreste erhalten bleibt.
- **Nachweis für VISOR-Artefakt-Bundles** – `createVisorArtifactBundleFromGraphql()`,
  `createVisorArtifactBundle()` und die Typen `visor-artifact-bundle/1`.
- **RE-036-Belege für gepackte Zellen** – `adaptPackedBijouCellsToSurface()` kopiert
  validierte Bytes und Seitentabelleneinträge, ohne Zellen neu zu kodieren.
- **Abschluss der Abhängigkeitssicherheit** – gepatchte Mindestversionen im gesamten
  aufgelösten Graphen, mit einem Regressionstest, der sie festschreibt, und einem
  sauberen `npm ci`, das ein Audit ohne Schwachstellen reproduziert.
- **Fortschritt der Code-Dojo-Ratsche** – Tranchen A bis E, dazu die Voraussetzungen
  für DX-050, die DOGFOOD-Lokalisierungsschulden und Arbeit am Dokumentationsvertrag.

## Wofür dieser Candidate gedacht ist

Zwei Verhaltensänderungen, die im Prinzip richtig und in der Praxis unerprobt sind.
Wenn `NO_COLOR` oder ein eigenes Theme für deine Anwendung wichtig ist, ist dies die
Version, die du ausprobieren solltest, bevor es `8.0.0` gibt.

Lies den [Migrationsleitfaden](./migration-guide.md) für die konkreten Prüfpunkte und
das [Release-Nachweispaket](./README.md) – es benennt ausdrücklich, welche Nachweise
für diesen Candidate erneut abgespielt und welche übernommen wurden, denn neun von elf
Review-Gates des Release-Gesetzes sind noch ungeprüft. Genau deshalb ist dies ein rc und
kein Release.
