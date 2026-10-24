# Neueste Funktionen

Dieser Leitfaden beschreibt den Arbeitsstand mit Paketversion
{{RELEASE_VERSION}} und Release-Linie {{RELEASE_LINE}}. Unter Unreleased in
`docs/CHANGELOG.md` aufgeführte Funktionen können hier bereits verfügbar sein,
bevor sie in einem veröffentlichten Paket enthalten sind. Eine laufende Demo
belegt keine stabile Veröffentlichung.

## Rasterschriften

`@flyingrobots/bijou-tui` exportiert `RasterFont`, `RasterFontGlyph`,
`layoutRasterText()`, `rasterizeText()` und `rasterTextSurface()`.
Der Kern verarbeitet unveränderliche, vorkompilierte Glyphenabdeckung und
Vorschubmaße. Das Dekodieren von Schriftdateien gehört in einen Adapter.
Die Markdown-Demo verwendet OpenType.js für lokale TTF/OTF-Dateien und Google
Fonts. DOGFOOD lädt kleine Offline-Atlanten.

```typescript
import { RasterFont, RasterFontGlyph, rasterTextSurface } from '@flyingrobots/bijou-tui';

const glyph = new RasterFontGlyph({
  advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2,
}, new Uint8Array([0b1001]));
const font = new RasterFont({
  family: 'Fixture', lineHeight: 3, glyphs: new Map([['A', glyph]]),
});
const surface = rasterTextSurface('AAA', font, {
  columns: 30, rows: 6, renderer: { kind: 'braille' },
});
```

RGBA-Ausgabe lässt sich über dieselbe Raster-Pipeline als Braille,
Quadrantenblöcke oder eigene Zeichen darstellen. Das Layout unterstützt
Codepunkte, Zeilenumbrüche und negative Seitenabstände, aber kein Shaping,
Bidi oder Kerning. Fehlende Glyphen benötigen einen expliziten Ersatz.
Beim Verkleinern bleiben bedeckte Atlas-Texel erhalten, damit dünne Stämme
nicht verschwinden. Subpixel-Striche können kräftiger werden und sehr kleine
Lücken können sich schließen.

Die API begrenzt Textlänge, Speicherbelegung, Glyphenarbeit und Oberflächengröße.
Die vollständigen Grenzen und das Abdeckungsformat stehen unter
**Packages → @flyingrobots/bijou-tui → Raster Fonts**.

## Markdown-Typografie-Demo

Im Repository-Stamm ausführen:

```sh
npm run markdown-font -- examples/markdown-font/sample.md --configure
npm run markdown-font -- document.md --font ./MyFont.otf
npm run markdown-font -- document.md --google-font "Lora"
npm run markdown-font -- document.md --offline --no-animation
npm run markdown-font -- document.md --offline --h1-size 36 --p-size 12
```

Die interaktive Google-Fonts-Auswahl durchsucht einen heruntergeladenen
Familienkatalog. Space Grotesk ist für den Offline-Betrieb enthalten. Downloads
bleiben während des Laufs im Speicher; es gibt keinen dauerhaften Cache.
Jede Anfrage hat ein Zeitlimit von 15 Sekunden. Katalog und Schrift sind jeweils
auf 8 MiB, CSS auf 64 KiB und Dokumente auf 1 MiB begrenzt. Familien mit mehreren
Teilzeichensatzdateien oder ohne einzelne TrueType-Quelle benötigen stattdessen
eine lokale TTF/OTF-Datei. Variable Schriften verwenden ihre Standardkonturen;
Farb- und Bitmap-Schriften werden nicht unterstützt.

Für `h1`, `h2`, `h3`, `h4` und `p` gibt es jeweils `--ELEMENT-font` und
`--ELEMENT-size`. Schriftwerte sind Google-Familiennamen, TTF/OTF-Pfade,
`google:FAMILY`, `file:PATH`, `default` oder `terminal`. Größen sind
Tintenhöhen von 4 bis 256 Pixeln; Braille benötigt `ceil(size / 4)` Zeilen.
Eine reine Größenangabe aktiviert die Standardschrift. H1 beginnt mit 24 Pixeln;
andere Elemente bleiben bis zur Konfiguration normaler Terminaltext. Listen,
Tabellen, Zitate und Code bleiben normale Markdown-Blöcke. Einstellungen gelten
nur für diesen Lauf und ändern das Quelldokument nicht.

Farben folgen dem Markenverlauf des aktiven Themes mit 10 FPS. Pfeiltasten oder
Mausrad scrollen, die Leertaste pausiert oder setzt fort, q oder Ctrl+C beendet.
Eine Größenänderung bricht den Text neu um. `--no-animation` schreibt in den
Scrollback. Nicht unterstützte Zeichen, Überschriften über 256 UTF-16-Einheiten,
Absätze über 20.000 Einheiten und sehr schmale Ansichten bleiben Text.
Rasterausgabe ist pro Dokument auf 1.048.576 Zellen begrenzt. Der vollständige
CLI-Vertrag steht in `examples/markdown-font/README.md`.

## Bedeutung in den Darstellungsmodi

Der Schrift-Renderer erzeugt die grafische Darstellung. Die umgebende Komponente
behält den Text und wählt die passende Ausgabe.

| Darstellung | Markdown-Demo | DOGFOOD-Titelaufforderung |
| :--- | :--- | :--- |
| Interaktiv | Schriftgeometrie und Theme-Animation | Space Grotesk und Farbverlauf |
| Statisch | Eingefrorener Rastertext | Lokalisierte Wörter |
| Pipe / barrierearm | Text; Pipe kann `--raster` ausdrücklich anfordern | Lokalisierte Wörter |
| Fehlende Glyphen / zu wenig Platz | Textersatz | Textersatz |

`NO_COLOR` unterdrückt Farbe, ohne die erkannte Interaktivität zu ändern.
Die Markdown-Demo wählt bei deaktivierter Farbe zusätzlich statische Ausgabe.
Sie interpretiert `NO_COLOR` nicht als fehlende Cursor- oder Eingabefähigkeit.

## Buch-Themes und Titelbildschirm

DOGFOOD verwendet standardmäßig zum Buch passende dunkle und helle Themes mit
Koralle und warmen Neutraltönen. Andere Shell-Themes bleiben über die
Einstellungen verfügbar. Theme Lab und der Theme Inspector mit F10 zeigen
Token-Auswahl und Diagnosen. Diese DOGFOOD-Themes ersetzen keine globalen
Bibliotheks-Presets.

Glyphen aus Jacquard 12 drehen sich auf einem Zylinder vor dezentem ASCII-Rauschen.
Die lokalisierte Aufforderung „Press [Enter]“ nutzt Space Grotesk in zwei oder
drei Zeilen, wenn Platz vorhanden ist. Beide Schriften sind lizenziert und
enthalten. Die Aufforderung nutzt einen Atlas druckbarer ASCII-Zeichen und
wechselt für andere Schriften zu Text. Reproduzierbarkeit prüfen:

```sh
npm run check:dogfood:title
npm run check:dogfood:prompt
```

## Aktuelle Referenzen und historische Quellen

Das Lehrbuch liegt jetzt in `flyingrobots/bijou-job-monitor`; die Lehranwendung
ist an Bijou 7.2.0 gebunden. Die vollständige Ausgabe und 426 Quelldokumente
dieses Repositorys bleiben historische Belege. DOGFOOD kennzeichnet Artikel
aus diesem Archiv als **Historische Referenz**. Ihre Aussagen behalten den
ursprünglichen Geltungsbereich und werden nicht automatisch aktualisiert.

Für neue Funktionen dienen dieser Leitfaden, aktuelle Paket-READMEs,
ausführbare Beispiele und der Changelog. **Aktuelle Release-Geschichte** folgt
der laufenden Version in allen vier unterstützten Sprachen.
**Packages → @flyingrobots/bijou-mcp** beschreibt den MCP-Adapter einschließlich
strukturierter Ausgabemodi und der Hyperlink-Grenze. GitHub-Issues und
Meilensteine bestimmen weiterhin die noch offene Release-Arbeit.
