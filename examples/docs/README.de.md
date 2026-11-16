# DOGFOOD-App-Notizen

[English](README.md) · [Français](README.fr.md) · [Español](README.es.md) · Deutsch

Wenn du Bijou lernen möchtest, beginne mit
[../../docs/DOGFOOD.md](../../docs/book/bijou-designs.pdf#page=292). Diese Datei ist die
implementierungsnahe Notiz zur aktuellen DOGFOOD-App-Oberfläche.

Erster DOGFOOD-Schnitt: eine storygetriebene Dokumentationsoberfläche, gebaut mit Bijou selbst.

## Ausführen

```sh
npm run dogfood
```

Für die eigenständige BlockLab-Werkbank zur Entwicklung und zum Testen starte:

```sh
npm run blocklab
```

Für einen textbasierten BlockLab-Index und eine Capture-Matrix über denselben DOGFOOD-Story-Katalog starte:

```sh
npm run blocklab:index
```

Du landest jetzt zuerst auf einem eigenen Vollbild-Titelbildschirm: Die App rendert über den Shader des Landing-Hintergrunds eine prozedurale, gestapelte Sinuswellen-Spur und schreibt die Spurfarben in die Zellhintergründe, während Dichte-Glyphen passende Vordergrundfarben verwenden. Danach nutzt sie [assets/Bijou.svg](../../assets/Bijou.svg) als
Glyphenmaske mit transparentem Hintergrund in Komplementärfarben. Der Landing-Bildschirm
bleibt sparsam:
die V7-Titelgrafik, ein zentrierter `Press [Enter]`-Hinweis, die
[assets/flyingrobotslogo.txt](../../assets/flyingrobotslogo.txt)-Wortmarke und eine
reservierte Fußzeile in der letzten Zeile mit Hinweisen zum Beenden und Fortfahren sowie der Bijou-Version. Die
Bijou-Marke bewahrt den vorhandenen Zellhintergrund, während sie aus der sichtbaren Spur
eine komplementäre Vordergrundfarbe ableitet. Die FlyingRobots-Braille-Wortmarke lässt leere
Asset-Zellen transparent, bewahrt den darunterliegenden Zellhintergrund für sichtbare
Glyphen und malt diese Glyphen in der Gegenfarbe des bewahrten
Hintergrunds.

Nur auf dem Landing-Bildschirm wechseln `1-5` zwischen Palettenvorgaben und `←` / `→` schalten durch die Themes. Der Backtick schaltet das gemeinsame Perf-HUD der Shell direkt ein und aus, `Esc` oder `q` beenden dort sofort, und jede andere Taste ohne Modifikator öffnet die Dokumentations-Shell.

Die Maus ist in dieser Vorschau aktiviert. In der Dokumentations-Shell fokussiert ein Klick auf einen Bereich diesen,
und mit dem Mausrad scrollst du lange Dokumente oder Hilfeinhalte.

## Was es beweist

- `ComponentStory` v0 kann strukturierte Lehrfelder statt eines einzelnen Markdown-Blobs enthalten
- eine Landing-Seite und eine Dokumentations-Shell können beide aus demselben Story-Unterbau gesteuert werden
- derselbe Story-Unterbau kann auch eine eigenständige BlockLab-Werkbank und eine deterministische Capture-Matrix erzeugen
- die Dokumentations-Shell kann sowohl Prosa-Leitfäden als auch den Komponenten-Explorer tragen
- der Dokumentationsbereich und der Vorschaubereich leiten sich beide vom selben Story-Datensatz ab, sobald du den Abschnitt `Components` betrittst
- der Profilwechsel ist Teil des Erlebnisses, nicht nachträglich angeflanscht
- eine gerahmte Shell kann sowohl Dokumentationsabschnitte der obersten Ebene als auch einen reichhaltigen Komponenten-Browser darstellen, ohne so zu tun, als wären das dasselbe
- die Dokumentations-Shell wählt jetzt explizit die Layoutvarianten `wide`, `standard`, `narrow` und `tiny`, sodass die Größenänderung des Terminals eine Produktentscheidung bleibt und nicht nur eine Neuberechnung der Geometrie
- DOGFOOD kann jetzt Repo-Orientierung, Paketdokumentation und Release-Dokumentation in derselben Shell veröffentlichen

## Enthaltene Story-Familien

- Feedback, Overlays, Viewport-Maskierung, Formulare, Navigation, Datenvisualisierung, Shell-Komposition und Bewegungs- und Shader-Effekte
- die Story zum dichten Vergleich zeigt jede visuelle `table()`-Variante,
  jede explizite Pipe-Serialisierung und den tastaturgesteuerten
  `navigableTableSurface()`-Pfad
- `motion-and-shader-effects` deckt jetzt Quad-Shader-Wellen, Braille-Felder, glyphenpassendes Raytracing und Feder-/Timeline-Orchestrierung über die Profile rich, static, pipe und accessible ab

## Tasten

- `Enter`: vom Landing-Bildschirm in die Dokumentation wechseln
- `Esc` / `q`: vom Landing-Bildschirm beenden
- `↑` / `↓`: Qualitätsmodi des Landing-Bildschirms durchschalten, bevor du die Dokumentation betrittst
- `1` `2` `3` `4` `5`: Theme-Vorgaben des Landing-Bildschirms wechseln
- `←` / `→`: Themes des Landing-Bildschirms durchschalten
- `[` / `]`: zwischen den Dokumentationsabschnitten der obersten Ebene wechseln
- `?`: Tastaturhilfe öffnen
- `/`: Komponenten-Stories und Dokumentationsseiten in der Standard-Suchoberfläche der Shell durchsuchen
- `F2`: die Standard-Einstellungsschublade der Shell öffnen
- Backtick: das Standard-Performance-HUD der Shell umschalten
- `↑` / `↓`: durch die Zeilen des fokussierten Bereichs navigieren
- `Enter` / `Space`: den fokussierten Leitfaden öffnen, eine Familie aufklappen, eine Komponente auswählen oder die fokussierte Zeile aktivieren
- `←` / `→`: die fokussierte Familie in der linken Spur innerhalb von `Components` einklappen oder aufklappen
- `Tab` / `Shift+Tab`: den Fokus zwischen den Bereichen wechseln
- `j` / `k`: den fokussierten Dokumentations- oder Demo-Bereich scrollen
- `d` / `u`: den fokussierten Dokumentations- oder Demo-Bereich seitenweise blättern
- `1` `2` `3` `4`: zwischen den Profilen rich, static, pipe und accessible wechseln
- `,` / `.`: vorherige oder nächste Story-Variante innerhalb von `Components`
- `?`: Tastaturhilfe öffnen oder schließen
- `q` / `Esc`: das Standard-Modal zur Beenden-Bestätigung öffnen

## Hinweise

- Das ist bewusst kleiner als das bestehende Showcase. Es ist ein lebendes Dokumentationsprodukt in Arbeit, noch nicht die endgültige Referenz.
- Die Dokumentation ist die Demo: Seitentext und Vorschau werden aus denselben strukturierten Story-Daten erzeugt.
- Der Titelbildschirm ist bewusst sparsam statt völlig leer. Er behält über der Shader-Behandlung nur den Einstiegshinweis und die Markenzeichen.
- Die Abschnitte `Guides`, `Packages`, `Philosophy` und `Release` sind nicht mehr nur Shell-Gerüst. Sie veröffentlichen jetzt echte Korpusseiten in der App, und der release-bezogene Smoke-Vertrag läuft jetzt über DOGFOOD statt über den breiten Beispielbaum.
- Die Dokumentations-Shell bietet bereits eine Shell-weite Suche über die Standard-Befehlspalette des Rahmens, sodass Nutzer direkt zu passenden Leitfäden oder Komponenten-Stories springen können, statt zuerst jede Liste von Hand durchzugehen.
- `npm run blocklab` öffnet eine eigenständige interaktive Werkbank zur Entwicklung und zum Testen von Komponenten über den Story-Katalog.
- `npm run blocklab:index` stellt den Story-Katalog als deterministische, textbasierte Arbeitsstation für Agenten, CI und künftige MCP- oder Block-Werkzeuge bereit. `npm run storybook`, `npm run storybook:index` und `npm run dogfood:storybook` bleiben während der Umbenennungsphase als Kompatibilitäts-Aliasse bestehen.
- DOGFOOD verwendet jetzt außerdem die Standard-Einstellungsschublade der Shell, sodass `F2`, die Befehlspalette oder Shell-Bindungen des Rahmens sichtbare Einstellungen wie Hinweise zu Steuerungen in der Fußzeile und die Landing-Qualität umschalten können, ohne dass die Dokumentations-App eigene Overlay-Technik mitbringt.
- Die Landing-Qualität lässt sich auch direkt auf dem Landing-Bildschirm anpassen, sodass Nutzer die Wirkung sehen, bevor sie die Titelgestaltung überhaupt verlassen.
- Die Dokumentations-Shell verwendet explizite responsive Layoutvarianten: wide hält Navigation, Inhalt und Metadaten-/Variantenkontext sichtbar; standard und narrow klappen sekundäre Bereiche zusammen; tiny rendert einen nützlichen Inhaltsbereich statt einer gequetschten mehrspaltigen Oberfläche.
- Einstellungszeilen tragen jetzt echte sekundäre Beschreibungen, Schalter werden mit checkboxartigen `☐` / `☑` dargestellt, und Auswahlzeilen verwenden eine eigene Wechselmarkierung, sodass die Schublade wie eine Produkt-Einstellungsoberfläche wirkt und nicht wie eine schlichte Textliste.
- Der Fokus besitzt jetzt die Eingabe im Explorer: Die Familienspur verarbeitet Durchsuchen-/Aufklappen-Tasten nur, solange sie aktiv ist, die Variantenspur kann Variantenwechsel per Pfeiltaste übernehmen, und Klicks auf Bereiche oder `Tab` reichen diese Zuständigkeit über die Standard-Rahmen-Shell weiter, statt inaktive Spuren weiter reagieren zu lassen.
- Die Fußzeile ist jetzt die wahrheitsgetreue Steuerungsoberfläche des Explorers: Shell-Hinweise bleiben sichtbar, Hinweise des aktiven Bereichs erscheinen nur, wenn sie auch etwas bewirken können, und veraltete Legenden im Bereich bleiben nicht mehr unter Shell-Overlays oder nach Fokuswechseln stehen.
- Wenn keine Komponente ausgewählt ist, dient die mittlere Spur jetzt als Onboarding-Oberfläche: Sie stellt Bijou selbst vor und erklärt, wie du die Dokumentation durchsuchst, konfigurierst und darin navigierst, bevor du eine Komponente öffnest.
- Der Explorer-Arbeitsbereich hält jetzt eine Zelle Abstand um die drei Hauptspalten und zwischen ihnen, damit Shell-Chrome und Bereichsränder an den Rahmenkanten nicht optisch abgeschnitten wirken.

[← DOGFOOD](../../docs/book/bijou-designs.pdf#page=292)
