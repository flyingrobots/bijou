# Components Library

[English](README.md) · [Français](README.fr.md) · [Español](README.es.md) · Deutsch

```sh
npm run components
```

Die Components Library ist ein Foliensatz mit 58 Folien: ein Titel, je eine Folie für jeden der 14 Abschnitte, gefolgt von seinen Komponenten, und eine Abschlussfolie. Ein Abschnitt fasst verwandte Komponentenfamilien zum Durchstöbern zusammen; die 42 Komponenten decken 35 der 36 Familien in `docs/design-system/component-families.md` ab. Sie zeigt jeweils eine Bijou-Komponente in der Bildschirmmitte, ohne dass etwas anderes um Aufmerksamkeit konkurriert. Sie nutzt denselben Katalog mit 42 Stories wie DOGFOOD und Block Lab und läuft im Standard-App-Rahmen von Bijou, sodass Suche, Einstellungen und Beenden sich verhalten wie in DOGFOOD.

Die Bibliothek öffnet sich mit einem Titelbildschirm „Components Library“ in DM Sans. Drücke Enter, um zu beginnen.

| Taste | Aktion |
| --- | --- |
| `h` `l`, Pfeil links und rechts | Vorherige oder nächste Folie, jeweils eine; hält an der ersten und letzten Folie an |
| `PgUp` `PgDn` (oder `[` `]`) | Vorherige oder nächste Abschnittsfolie; hält bei Titel- und Abschlussfolie an |
| `Tab`, `Shift-Tab` | Das Karussell zur nächsten oder vorherigen Variante schieben |
| `j` `k`, Pfeil nach oben und unten | Scrollen, wenn der Inhalt höher ist als der Bildschirm |
| `1` `2` `3` `4` | Ausgabemodus: interactive, static, pipe, accessible |
| `i` | Info ein oder aus: der Familieneintrag der Komponente im Design-System und das Beispiel der angezeigten Variante (siehe unten) |
| `r` | Rechts-nach-links-Layout ein oder aus |
| `/` | Komponentennamen suchen; Enter zeigt den Treffer, Esc schließt |
| `F2` | Einstellungen, einschließlich des Shell-Themes |
| `?` | Alle Tastenbelegungen |
| `q`, `Esc` | Beenden, nach einer Bestätigung |

Ein Balken in der obersten Zeile, anstelle der Rahmenkopfzeile, zeigt, wie weit du im gesamten Foliensatz bist, und endet in einer Beschriftung wie „3 von 58“. Die Library zeichnet diesen Balken selbst: Er zeigt eine Position in einer Folge, nicht den Fortschritt einer Aufgabe, daher verwendet er nicht `progressBar()`. Eine Brotkrumennavigation über der Komponente nennt ihren Abschnitt und die Komponente. Bijous `tabs()` unter der Komponente listen ihre Varianten auf und weichen auf `paginator()`-Punkte aus, wenn die Tabs breiter sind als der Bildschirm. Die unterste Zeile zeigt die Ausgabemodi als Tabs, dann die Schalter für Info und Rechts-nach-links mit ihrem Zustand (`i info off · r RTL off`). Die Fußzeile des Rahmens zeigt die Navigationstasten.

## Auf einem bestimmten Bildschirm öffnen

Übergib Optionen nach `--`, um die Bibliothek auf einer bestimmten Folie, in einem bestimmten Ausgabemodus und mit einem bestimmten Theme zu öffnen:

```sh
npm run components -- --component alert --variant warning --mode pipe --info
npm run components -- --component table --theme book --scheme light --rtl
npm run components -- --component toast --slide family
```

| Option | Werte |
| --- | --- |
| `--component` | Eine Story-ID oder ein Funktionsname, etwa `alert` oder `table` |
| `--variant` | Eine Varianten-ID oder -Beschriftung, etwa `warning` |
| `--mode` | `interactive`, `static`, `pipe` oder `accessible` |
| `--info` | Mit angezeigter Info öffnen |
| `--rtl` | Im Rechts-nach-links-Layout öffnen |
| `--slide` | `title`, `family` (die Abschnittsfolie), `component` oder `end` (Standard: `component`, wenn `--component` angegeben ist, sonst `title`) |
| `--theme` | Eine Shell-Theme-Familie: `book` oder `dogfood` |
| `--scheme` | `dark` oder `light` |

Unbekannte Optionen oder Werte geben das Problem und die Verwendung aus und beenden sich mit Status 2.

## Abschnittsfolien

Die Folie jedes Abschnitts zeigt die Bijou-Wortmarke in ihrer eigenen Schrift (Jacquard 12) über dem Abschnittsnamen. Beim Weiterschalten wird die Folie angezeigt. Sie listet die Funktionen des Abschnitts zeilenweise auf, gruppiert unter den Namen ihrer Familien im Design-System, zum Beispiel **Transient app notifications** oder **Activity stream**. Jede Abschnittsfolie wird mit demselben Bijou-Übergang ein- und ausgeblendet, einer Zellauflösung.

Folien schalten nie von selbst weiter. Drücke Enter, Space, `l`, den Pfeil nach rechts oder Tab, um zur ersten Komponente des Abschnitts weiterzugehen, oder `h` oder den Pfeil nach links, um zurückzugehen. Auch die Titel- und die Abschlussfolie zeigen die Wortmarke.

## Info und Beispiele

`i` zeigt den Eintrag der Komponente im Vokabular der Referenz zu den Komponentenfamilien des Design-Systems (Buchdatensatz R52). Er beginnt mit dem Familiennamen und einer Zusammenfassung, dann folgt ein Kasten mit dem Titel **Tip for this variant** mit dem Tipp zur angezeigten Variante. Darunter listet **When to use each variant** jede Variante mit ihrem Tipp auf; das bleibt gleich, wenn du die Variante wechselst. Dann folgen **Use when**, **Avoid when**, **Content guidance**, **Ownership**, **Graceful lowering** und **Related families**, danach ein **Example**. Die Story der Komponente liefert ein Feld, wo sie eines hat; ihr Familieneintrag in `docs/design-system/component-families.md` liefert **Content guidance** und **Ownership** und füllt jedes Feld, das der Story fehlt. `guidedFlow()` hat noch keinen Familieneintrag, daher zeigt sein Panel nur die Felder der Story.

Das Beispiel ist der eigene `render()`-Aufruf der Variante, gelesen aus ihrer Story-Datei in `examples/docs/`. Lange Beispiele werden gekürzt und als solche gekennzeichnet. Manche Stories rufen einen gemeinsamen Vorschau-Helfer auf, daher zeigt ihr Beispiel diesen Helfer statt eines bloßen Komponentenaufrufs.

Komponenten, die animiert sind, öffnen sich mit ihrer animierten Variante. Der Modus interactive spielt sie ab; der Modus static zeigt ein eingefrorenes Bild.

## Rechts-nach-links-Layout

`r` schaltet die Leserichtung um. Die Library reicht sie über eine i18n-Runtime an den App-Rahmen weiter und spiegelt ihren eigenen Körper: den Fluss der Brotkrumennavigation, die Modus-Zeile, die Folienrichtung des Karussells und die Ausrichtung von Prosa und Folien. Im Rechts-nach-links-Layout bewegen `h`, `[` und der Pfeil nach links sich zum Ende der Liste hin. Code, Funktionsnamen und die Komponenten selbst werden nicht gespiegelt.

Der App-Rahmen spiegelt nur, was er heute unterstützt: Die Einstellungsschublade und Benachrichtigungen öffnen sich von der anderen Seite. Kopfzeile, Fußzeile und Bereichs-Chrome spiegeln noch nicht; die Issues #571 bis #575 verfolgen die verbleibende Rechts-nach-links-Arbeit.

## Eine Vorführung aufzeichnen

`npm run record:components` zeichnet `components.webp` auf, ein animiertes WebP in Vollfarbe (nicht eingecheckt; braucht `img2webp` aus `brew install webp`): jede Folie in der Reihenfolge des Foliensatzes, vom Titel bis zur Abschlussfolie, jeweils ein `l`-Tastendruck auf einer Mock-Uhr. Titel-, Familien- und Abschlussfolien verweilen länger als Komponentenfolien. `npm run record:components -- --out=path.webp` schreibt woandershin (ein `.gif`-Pfad schreibt ein GIF), und `-- --stills=1,45` schreibt zusätzlich PNG-Standbilder zu diesen Zeitpunkten in Sekunden.
