---
title: "@flyingrobots/bijou-tui"
summary: "Die Vollbild-Laufzeit: TEA-Schleife, Layout, Bewegung, Overlays und Shell-Infrastruktur."
---
# @flyingrobots/bijou-tui

Die originalgetreue TEA-Laufzeit für Bijou.

`@flyingrobots/bijou-tui` stellt die Anwendungsschleife, Layout-Primitive und physikbasierte Orchestrierung bereit, die für komplexe interaktive Terminal-Apps nötig sind.

## Rolle

- **The Elm Architecture (TEA)**: Eine deterministische State-Update-View-Schleife für Terminalsoftware in Industriequalität.
- **Fraktales TEA**: Setze verschachtelte Sub-Apps zusammen mit `createSubAppAdapter()`, `initSubApp()`, `updateSubApp()` und `mount()`.
- **Deklarative Bewegung**: Interpoliere Layoutänderungen sanft mit physikbasierten Federn und Tween-Animationen.
- **Surface-First-Pipeline**: Programmierbare Rendering-Middleware für Fragmente, Diffing und shaderbasierte Übergänge.

## Installation

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Schnellstart (Sub-App-Komposition)

```typescript
import { startApp } from '@flyingrobots/bijou-node';
import { createSubAppAdapter, mount, type App } from '@flyingrobots/bijou-tui';
import { createSurface } from '@flyingrobots/bijou';

type ChildMsg = { type: 'tick' };
type ParentModel = {
  left: { count: number };
  right: { count: number };
};
type ParentMsg = { type: 'left'; msg: ChildMsg } | { type: 'right'; msg: ChildMsg };

const childApp: App<{ count: number }, ChildMsg> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const s = createSurface(20, 5);
    s.fill({ char: '.' });
    return s;
  }
};

const mapLeft = createSubAppAdapter<ParentMsg, ChildMsg>({
  tick: (msg) => ({ type: 'left', msg }),
});

const mapRight = createSubAppAdapter<ParentMsg, ChildMsg>({
  tick: (msg) => ({ type: 'right', msg }),
});

const app: App<ParentModel, ParentMsg> = {
  init: () => [{ left: { count: 0 }, right: { count: 0 } }, []],
  update: (msg, model) => [model, []],
  view: (model) => {
    const [left] = mount(childApp, { model: model.left, onMsg: mapLeft });
    const [right] = mount(childApp, { model: model.right, onMsg: mapRight });
    
    const screen = createSurface(80, 24);
    screen.blit(left, 0, 0);
    screen.blit(right, 40, 0);
    return screen;
  }
};

await startApp(app);
```

Für Node-Hosts ist `startApp()` der bevorzugte Weg zur ersten App. Greife zu
`run(app, { ctx })`, wenn der Host die Kontexterzeugung explizit selbst übernimmt.

Wenn du kleine String-Fragmente mit Primitiven mischen musst, die Surfaces zurückgeben,
halte die Komposition auf der Surface-Seite: Verwende `contentSurface()` direkt oder übergib
Strings an `vstackSurface()` / `hstackSurface()`. Rohe Strings sind weiterhin kein
gültiger Rückgabetyp für `view()`.

Verwende `proseSurface(text, { width })`, wenn absatzartiger Text an Wortgrenzen
umbrechen soll, bevor er zur Surface wird. Behalte `contentSurface()` für
vorformatierte Ausgabe, Tabellen, Boxen und vom Aufrufer verwaltete Zeilenumbrüche.

## Strategie: Komponentenfamilien auswählen

Wähle die Familie anhand der Interaktionssemantik.

### Overlays und Unterbrechung
- **`drawer()`**: Ergänzende Details, während der Hauptkontext erhalten bleibt.
- **`modal()`**: Erforderliche Entscheidung, die Aktivität im Hintergrund blockiert.
- **`toast()`**: Flüchtige Benachrichtigung zu einem einzelnen Ereignis.
- **`tooltip()`**: Mikro-Erklärung für ein lokales Ziel.
- **`debugOverlay()`**: Nur für die Entwicklung: Performance-HUD, das über jede App-Surface gelegt wird.
- **`layoutInspectorOverlay()`**: Nur für die Entwicklung: Geometrie-HUD für Bereichs-
  grenzen, Fokus und Ebenen.
- **`inputRoutingInspectorText()`**: Nur für die Entwicklung: Routing-Trace für die letzten
  Tasten- und Zeigerereignisse.
- **`focusMapText()`**: Nur für die Entwicklung: Bericht über Fokuszuständigkeit und Tab-Reihenfolge.
- **`evaluateSurfaceBudget()`**: Deterministische Warnungen für Surface- und Timing-
  Schwellenwerte.
- **`surfaceDiffSurface()`**: Inspektion zweier gerenderter Surfaces nebeneinander oder überlagert.

### Interaktion mit Sammlungen
- **`navigableTable()`**: Tastaturgesteuertes Durchlaufen und Inspizieren von Zellen.
- **`browsableList()`**: Beschreibungsgeführtes Durchlaufen in einer Dimension.
- **`commandPalette()`**: Entdecken von Aktionen und Navigation.

### Shell- und Workspace-Layout
- **`createFramedApp()`**: Workspace mit allem Nötigen: Tabs, Fenster,
  Hilfe und ein shell-eigenes Performance-HUD, das mit der Backtick-Taste umgeschaltet wird.
- **`splitPane()`**: Dynamischer Vergleich von Haupt- und Nebenkontext.
- **`grid()`**: Stabile Bereiche, die gleichzeitig sichtbar sind.
- **`viewport()`**: Die kanonische Scroll-Maske für reichhaltige Komposition.

Auch für gerahmte Shells können Node-Hosts `startApp(app)` bevorzugen: Der gehostete
Node-Bootstrap delegiert automatisch an selbstlaufende gerahmte Apps. Nutze den
expliziten Runner-Pfad, wenn du innerhalb von `@flyingrobots/bijou-tui` bleiben willst
oder wenn der Host `ctx` direkt besitzt:

```typescript
import { createFramedApp, runFramedApp } from '@flyingrobots/bijou-tui';

const app = createFramedApp({ pages: [page] });

await app.run({ ctx });
// or: await runFramedApp({ pages: [page] }, { ctx });
```

Auf diesem Pfad bringt die Shell weiterhin alles Nötige mit: Mauseingabe ist standardmäßig `true`,
die gemeinsame Laufzeitschleife erledigt weiterhin die Schwerarbeit, und die Telemetrie zu Frame-Timing und -Budget
bleibt für die shell-eigene Oberfläche am Frame-Modell angehängt. Für Node-gehostete
Apps bleibt `startApp(app)` der Standard-Bootstrap.

## Laufzeitdiagnose

Der EventBus stellt Fakten zur Befehlswarteschlange über `getCommandDiagnostics()` bereit.
`run(app, { commandBackpressureThreshold })` leitet eine Warnung weiter, wenn ausstehende
Befehle den Schwellenwert überschreiten, ohne legitime Lastspitzen hart zu begrenzen. Der
Standardschwellenwert ist 1000; verwende `0`, um die Warnung zu deaktivieren.

Middleware der Render-Pipeline ist per Vertrag synchron. Gibt eine Middleware ein
Promise zurück, meldet Bijou eine Pipeline-Diagnose, lässt den aktuellen Frame weiterlaufen
und ignoriert jede verspätete `next()`-Fortsetzung, damit die Reihenfolge der Stufen
deterministisch bleibt.

## Animation

### Federphysik
```typescript
import { animate, SPRING_PRESETS } from '@flyingrobots/bijou-tui';

const cmd = animate({
  from: 0,
  to: 100,
  spring: 'wobbly',
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

Feder-Befehle integrieren die Physik standardmäßig mit begrenzten festen Zeitschritten, sodass ein
langsamer Terminal-Frame kein großes rohes Puls-Delta in die Feder einspeisen kann. Passe
`fixedStepSeconds` und `maxPulseSeconds` nur an, wenn eine App einen eigenen
Simulationstakt braucht.

### Orchestrierung mit Timelines
```typescript
import { timeline } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn', { type: 'tween', from: -100, to: 0, duration: 300 })
  .label('settled')
  .add('bounce', { from: 0, to: 10, spring: 'wobbly' }, 'settled')
  .build();
```

## Post-Processing-Shader

`canvas()` kann prozedurale Surfaces in Zellen-, Quad-, Braille- oder glyphenangepasster
Auflösung rendern. Verwende `resolution: 'glyph'`, wenn ein Shader ein 2x4-Raster abtasten, das Ergebnis
aber statt in Braille in geometriebewusste Unicode- oder ASCII-Zeichen zusammenfassen soll.

```typescript
import { canvas } from '@flyingrobots/bijou-tui';

const logo = canvas(24, 6, ({ u, v }) => {
  const lit = Math.abs(u - v) < 0.08;
  return lit ? { char: 'X', fg: '#ffffff' } : ' ';
}, { resolution: 'glyph' });
```

```typescript
import { run, surfaceShaderFilter, scanlines, vignette } from '@flyingrobots/bijou-tui';

await run(app, {
  configurePipeline(pipeline) {
    pipeline.use('PostProcess', surfaceShaderFilter(
      scanlines({ dimFactor: 0.82 }),
      vignette({ edgeFactor: 0.78 }),
    ));
  },
});
```

Verwende `surfaceShaderFilter(...)`, um eingebaute Post-Processing-Durchläufe wie
`scanlines()`, `flicker()`, `noise()` und `vignette()` vor Diff/Ausgabe über die gepackte Ziel-
Surface zu legen.

## Testen

Verwende `testRuntime()`, wenn du statt eines einmaligen Skriptergebnisses ein
inspizierbares Harness willst:

```typescript
import { testRuntime } from '@flyingrobots/bijou-tui';

const harness = await testRuntime(app, { ctx });
await harness.press('q');

expect(harness.frame).toBeDefined();
expect(harness.messages).toHaveLength(1);
expect(harness.commands.every((record) => record.settled)).toBe(true);

await harness.teardown();
```

Behalte `runScript()` für fixture-artiges Abspielen von Interaktionen und GIF-/Demo-
Aufnahmen, und verwende `testRuntime()`, wenn du direkte Assertions auf
Snapshots, ausgegebene Nachrichten, Befehlsergebnisse oder das Aufräumen brauchst.

Das Abspielen von Mausaktionen kann Hilfsschritte statt handgeschriebener `MouseMsg`-
Objekte verwenden. `sgrMouse()` parst rohe SGR-Maussequenzen, wenn ein Regressionstest
direkt den Eingabebytes des Terminals entsprechen soll.

```typescript
import { mouseMove, mousePress, mouseRelease, mouseWheel, runScript, sgrMouse } from '@flyingrobots/bijou-tui';

await runScript(app, [
  mouseMove(12, 4),
  mousePress('left', 12, 4),
  mouseRelease('left', 12, 4),
  mouseWheel('down', 12, 8),
  sgrMouse('\x1b[<35;10;20M'),
]);
```

Für Integrationen gerahmter Apps, die Befehle auf Seitenebene einpacken oder weiterleiten müssen,
importiere die seitenbezogenen Frame-Helfer aus dem Paket-Root:

```typescript
import { PAGE_MSG_TOKEN, emitMsgForPage, isPageScopedMsg, wrapCmdForPage, wrapPageMsg } from '@flyingrobots/bijou-tui';
```

Verwende `surfaceDiffText()` oder `surfaceDiffSurface()`, wenn eine Frame-Assertion fehlschlägt
und du statt eines rohen String-Dumps die Wahrheit auf Zellenebene brauchst:

```typescript
import { surfaceDiffText } from '@flyingrobots/bijou-tui';

expect(surfaceDiffText(before, after)).toContain('surface diff: 2 changed');
```

Verwende `layoutInspectorOverlay()`, wenn eine Layout-Assertion die visuelle Geometrie
über dem gerenderten Frame braucht:

```typescript
import {
  layoutInspectorOverlay,
  layoutInspectorText,
} from '@flyingrobots/bijou-tui';

const inspected = layoutInspectorOverlay(frame, [
  {
    id: 'editor',
    rect: { col: 2, row: 1, width: 40, height: 12 },
    focused: true,
  },
]);

expect(layoutInspectorText([
  { id: 'editor', rect: { x: 2, y: 1, width: 40, height: 12 } },
]))
  .toContain('focused=false');
```

Verwende `evaluateSurfaceBudget()` direkt in Tests oder übergib `surfaceBudget` an
`run()`, wenn eine interaktive App nicht fatale Laufzeitwarnungen weiterleiten soll:

```typescript
import { evaluateSurfaceBudget, run } from '@flyingrobots/bijou-tui';

expect(evaluateSurfaceBudget({
  surface: frame,
  thresholds: { maxArea: 4000 },
})).toEqual([]);

await run(app, {
  ctx,
  surfaceBudget: { maxArea: 4000, maxStageDurationMs: { Paint: 8 } },
});
```

Verwende `appendInputRoutingRecord()` und `inputRoutingInspectorText()`, wenn eine Shell
oder App die letzten Routing-Entscheidungen sichtbar halten will:

```typescript
import {
  appendInputRoutingRecord,
  inputRoutingInspectorText,
} from '@flyingrobots/bijou-tui';

const history = appendInputRoutingRecord({ records: [] }, {
  event,
  result,
  commandLabels: ['save-file'],
});

console.log(inputRoutingInspectorText(history));
```

Verwende `createInputGestureRecognizer()` und `createInputActionMap()`, wenn rohe Eingaben
vor dem Routing zu semantischen Gesten werden müssen. Bijou liefert Standard-Ereignisnamen
wie `press`, `held`, `release`, `tap`, `double-tap` und
`long-press` mit und lässt Apps eigene Ereignistyp-Strings angeben.

```typescript
import {
  createInputActionMap,
  createInputGestureRecognizer,
} from '@flyingrobots/bijou-tui';

const recognizer = createInputGestureRecognizer({ doubleTapMs: 300 });
const actions = createInputActionMap<{ type: 'open-jump-list' }>()
  .bind('nav.doubleG', 'Open jump list', [
    { deviceId: 'keyboard', featureId: 'key.g', type: 'double-tap' },
  ], { type: 'open-jump-list' });

const action = actions.handle(recognizer.observeKey(keyMsg, ctx.runtime.clock.now()));
```

Verwende `focusMapText()` oder `focusMapSurface()`, wenn Fokuszuständigkeit und Tab-Reihenfolge
dieselbe deterministische Behandlung brauchen:

```typescript
import { focusMapText } from '@flyingrobots/bijou-tui';

const report = focusMapText([
  {
    id: 'editor',
    owner: 'workspace',
    role: 'textbox',
    rect: { x: 2, y: 1, width: 60, height: 20 },
    tabIndex: 1,
    focusable: true,
    focused: true,
  },
]);

expect(report).toContain('[1] *editor');
```

## Rasterschriften

`RasterFont` speichert validierte, unveränderliche Glyphenabdeckung und Vorschubmetriken.
`layoutRasterText()` stellt positionierte Glyphen für Effekte wie den Zylinder von
DOGFOOD bereit. `rasterizeText()` liefert einen RGBA-Frame schwarz auf transparent, während
`rasterTextSurface()` diese Abdeckung durch den vorhandenen Braille-, Quadranten-
block- oder Eigenzeichen-Renderer schickt.

```typescript
import { RasterFont, RasterFontGlyph, rasterTextSurface } from '@flyingrobots/bijou-tui';

// A tiny bitmap fixture; production atlases use coverage compiled from a font.
const glyph = new RasterFontGlyph({
  advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2,
}, new Uint8Array([0b1001]));
const font = new RasterFont({
  family: 'Demo', lineHeight: 3, glyphs: new Map([['A', glyph]]),
});
const title = rasterTextSurface('AAA', font, {
  columns: 30, rows: 6, renderer: { kind: 'braille' },
  fg: '#f7685f', bg: '#1c1716',
});
```

Abdeckungsbits laufen Zeile für Zeile, niederwertigstes Bit zuerst. Die Metriken teilen sich ein
Koordinatensystem: `left` und `top` sind Bearings relativ zum Glyphenursprung;
`advance` verschiebt den nächsten Ursprung. Negative Bearings und mehrzeiliger Text bleiben
erhalten. Eine Schrift besitzt eine Kopie ihrer Zuordnungstabelle, und jede Glyphe besitzt ihre Maske.
Unbekannte Codepoints lösen einen Fehler aus, sofern die Schrift nicht ausdrücklich eine Fallback-Glyphe nennt.
Diese erste API erledigt Layout auf Codepoint-Ebene, ohne Shaping, Bidi oder Kerning.
Leerer Text erzeugt einen transparenten RGBA-Frame von 1 × 1, sodass er direkt
durch `rasterToGlyphSurface()` laufen kann. Surface-Farben stammen aus `fg` und `bg`;
die Abdeckung ist monochrom und nutzt nicht die Farbabtastung des Bild-Renderers.

Beim Verkleinern der Glyphenabdeckung bewahrt der Text-Rasterizer jedes abgedeckte Atlas-
Texel, indem er die Ausgabepixel markiert, die es überlappt. Dünne Stämme und Balken
überleben daher auch zwischen den Mittelpunkten der Ausgabepixel. Bei kleinen Größen kann das einen Strich
auf ein Pixel aufrunden oder eine Lücke schließen, die kleiner als ein Pixel ist. Beim Vergrößern bleibt
die Nearest-Neighbor-Abdeckung erhalten. Das Arbeitsbudget umfasst Atlas-Zugriffe und projizierte
Pixel-Schreibvorgänge ebenso wie die Ausgabeabtastung.

Braille- und Quadranten-Text-Surfaces behalten beim Einpassen in das Terminalraster standardmäßig
jede Abdeckung ungleich null. Ein expliziter Renderer-`threshold` überschreibt
diesen Standard. Eigene Zeichensätze behalten die Dichtezuordnung des Bild-Renderers.

Liefere vorkompilierte Abdeckung; der Renderer lädt keine TTF-Dateien, installiert keine Schriften
und stellt keine Netzwerkanfragen. Der Jacquard-12-Generator von DOGFOOD demonstriert die Offline-
Extraktion aus OpenType und bewahrt die Lizenz der Schrift unter `assets/fonts/`.
Halte für wesentliche Informationen in den Darstellungen pipe und accessible eine lesbare
Textalternative bereit: Rasterschrift ist eine Illustration.

Das Rendering lehnt mehr als 20.000 Eingabe-Codeeinheiten, 1.048.576 allokierte Pixel
oder 16.777.216 Glyphen-Abtastungen ab. Die Surface-Ausgabe ist auf 131.072 Zellen, 4.096
Spalten und 1.024 Zeilen begrenzt. Die Pixelhöhe der Ausgabe muss eine ganze Zahl von 1 bis 4.096 sein.
Der Aufrufer wählt seine eigene Caching-Strategie; die Bibliothek hat keinen globalen Schrift-Cache.

## Dokumentation

- **[GUIDE.md](./GUIDE.md)**: Der schnelle, produktive Weg zum Bauen von Apps.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Shell-Doktrin, Shader und Interna der Bewegung.
- **[Leitfaden zur Render-Pipeline](../../docs/book/bijou-designs.pdf#page=332)**: Reihenfolge der Stufen, `RenderState` und die Wahrheit über `configurePipeline()`.
- **[Designsystem](../../docs/book/bijou-designs.pdf#page=338)**: Semantische Hinweise und Muster.

---
Gebaut mit 💎 von [FLYING ROBOTS](https://github.com/flyingrobots)
