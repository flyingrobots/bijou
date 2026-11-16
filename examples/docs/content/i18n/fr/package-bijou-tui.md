---
title: "@flyingrobots/bijou-tui"
summary: "Le runtime plein écran : boucle TEA, mise en page, animation, superpositions et infrastructure de shell."
---
# @flyingrobots/bijou-tui

Le runtime TEA haute fidélité de Bijou.

`@flyingrobots/bijou-tui` fournit la boucle d'application, les primitives de mise en page et l'orchestration à base de physique nécessaires pour construire des applications terminal interactives complexes.

## Rôle

- **The Elm Architecture (TEA)** : une boucle état-mise à jour-vue déterministe pour des logiciels terminal de qualité industrielle.
- **TEA fractale** : composez des sous-applications imbriquées avec `createSubAppAdapter()`, `initSubApp()`, `updateSubApp()` et `mount()`.
- **Animation déclarative** : interpolez en douceur les changements de mise en page avec des ressorts physiques et des animations d'interpolation (tween).
- **Pipeline Surface-First** : middleware de rendu programmable pour les fragments, le diff et les transitions à base de shaders.

## Installation

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Démarrage rapide (composition de sous-applications)

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

Pour les hôtes Node, préférez `startApp()` pour une première application.
Utilisez `run(app, { ctx })` lorsque l'hôte gère lui-même explicitement la
création du contexte.

Lorsque vous devez mélanger de petits fragments de chaînes avec des primitives
qui renvoient des surfaces, gardez la composition du côté des surfaces :
utilisez directement `contentSurface()` ou passez des chaînes à
`vstackSurface()` / `hstackSurface()`. Les chaînes brutes ne sont toujours pas
un type de retour valide pour `view()`.

Utilisez `proseSurface(text, { width })` lorsqu'un texte de type paragraphe doit
être renvoyé à la ligne aux limites de mots avant de devenir une surface.
Réservez `contentSurface()` à la sortie préformatée, aux tableaux, aux boîtes et
aux sauts de ligne gérés par l'appelant.

## Stratégie : choisir les familles de Composants

Choisissez la famille selon la sémantique d'interaction.

### Superpositions et interruption
- **`drawer()`** : détail complémentaire tout en conservant le contexte principal.
- **`modal()`** : décision obligatoire qui bloque l'activité en arrière-plan.
- **`toast()`** : notification passagère pour un événement unique.
- **`tooltip()`** : micro-explication pour une cible locale.
- **`debugOverlay()`** : HUD de performance réservé au développement, composé sur n'importe quelle surface d'application.
- **`layoutInspectorOverlay()`** : HUD de géométrie réservé au développement
  pour les limites de régions, le focus et les calques.
- **`inputRoutingInspectorText()`** : trace de routage réservée au
  développement pour les événements clavier et pointeur récents.
- **`focusMapText()`** : rapport de propriété du focus et d'ordre de tabulation réservé au développement.
- **`evaluateSurfaceBudget()`** : avertissements déterministes pour les seuils
  de surface et de temps.
- **`surfaceDiffSurface()`** : inspection côte à côte ou superposée de deux surfaces rendues.

### Interaction avec les collections
- **`navigableTable()`** : parcours au clavier et inspection des cellules.
- **`browsableList()`** : parcours guidé par les descriptions sur une dimension.
- **`commandPalette()`** : découverte d'actions et navigation.

### Mise en page du shell et de l'espace de travail
- **`createFramedApp()`** : espace de travail tout compris avec onglets, volets,
  aide et un HUD de performance géré par le shell, activé avec la touche accent grave.
- **`splitPane()`** : comparaison dynamique entre contexte principal et secondaire.
- **`grid()`** : régions stables visibles simultanément.
- **`viewport()`** : le masque de défilement canonique pour une composition riche.

Pour les shells encadrés, les hôtes Node peuvent toujours préférer
`startApp(app)` : l'amorçage Node hébergé délègue automatiquement aux
applications encadrées autonomes. Utilisez le chemin d'exécution explicite si
vous voulez rester dans `@flyingrobots/bijou-tui` ou si l'hôte gère `ctx`
directement :

```typescript
import { createFramedApp, runFramedApp } from '@flyingrobots/bijou-tui';

const app = createFramedApp({ pages: [page] });

await app.run({ ctx });
// or: await runFramedApp({ pages: [page] }, { ctx });
```

Ce chemin garde le shell tout compris : la souris est activée par défaut
(`true`), la boucle de runtime partagée fait toujours le gros du travail, et la
télémétrie de timing et de budget des frames reste attachée au modèle de frame
pour l'interface gérée par le shell. Pour les applications hébergées sous Node,
`startApp(app)` reste l'amorçage par défaut.

## Diagnostics du runtime

L'EventBus expose les informations de la file de commandes via
`getCommandDiagnostics()`. `run(app, { commandBackpressureThreshold })` émet un
avertissement lorsque les commandes en attente dépassent le seuil, sans plafonner
strictement les rafales légitimes. Le seuil par défaut est 1000 ; utilisez `0`
pour désactiver l'avertissement.

Le middleware du pipeline de rendu est synchrone par contrat. Si un middleware
renvoie une Promise, Bijou signale un diagnostic de pipeline, poursuit la frame
en cours et ignore toute continuation `next()` tardive afin que l'ordre des
étapes reste déterministe.

## Animation

### Physique des ressorts
```typescript
import { animate, SPRING_PRESETS } from '@flyingrobots/bijou-tui';

const cmd = animate({
  from: 0,
  to: 100,
  spring: 'wobbly',
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

Par défaut, les commandes de ressort intègrent la physique avec des pas de temps
fixes bornés, de sorte qu'une frame de terminal lente ne peut pas injecter un
grand delta d'impulsion brut dans le ressort. N'ajustez `fixedStepSeconds` et
`maxPulseSeconds` que si une application a besoin d'une cadence de simulation
personnalisée.

### Orchestration par timeline
```typescript
import { timeline } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn', { type: 'tween', from: -100, to: 0, duration: 300 })
  .label('settled')
  .add('bounce', { from: 0, to: 10, spring: 'wobbly' }, 'settled')
  .build();
```

## Shaders de post-traitement

`canvas()` peut rendre des surfaces procédurales en résolution cellule, Quad,
Braille ou glyph-fit. Utilisez `resolution: 'glyph'` lorsqu'un shader doit
échantillonner une grille 2x4 mais se réduire en caractères Unicode ou ASCII
adaptés à la géométrie plutôt qu'en Braille.

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

Utilisez `surfaceShaderFilter(...)` pour composer des passes de post-traitement
intégrées comme `scanlines()`, `flicker()`, `noise()` et `vignette()` sur la
surface cible compactée avant le diff et la sortie.

## Tests

Utilisez `testRuntime()` lorsque vous voulez un harnais inspectable plutôt que
le résultat d'un script exécuté une seule fois :

```typescript
import { testRuntime } from '@flyingrobots/bijou-tui';

const harness = await testRuntime(app, { ctx });
await harness.press('q');

expect(harness.frame).toBeDefined();
expect(harness.messages).toHaveLength(1);
expect(harness.commands.every((record) => record.settled)).toBe(true);

await harness.teardown();
```

Gardez `runScript()` pour la relecture d'interactions de type fixture et la
capture de GIF ou de démos, et utilisez `testRuntime()` lorsque vous avez besoin
d'assertions directes sur les instantanés, les messages émis, les résultats des
commandes ou la libération des ressources.

La relecture de la souris peut utiliser des étapes utilitaires plutôt que des
objets `MouseMsg` écrits à la main. `sgrMouse()` analyse des séquences souris SGR
brutes lorsqu'un test de régression doit correspondre directement aux octets
d'entrée du terminal.

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

Pour les intégrations d'applications encadrées qui doivent envelopper ou router
des commandes au niveau des pages, importez les utilitaires de frame limités à
une page depuis la racine du package :

```typescript
import { PAGE_MSG_TOKEN, emitMsgForPage, isPageScopedMsg, wrapCmdForPage, wrapPageMsg } from '@flyingrobots/bijou-tui';
```

Utilisez `surfaceDiffText()` ou `surfaceDiffSurface()` lorsqu'une assertion sur
une frame échoue et que vous avez besoin de la vérité au niveau des cellules
plutôt que d'un vidage brut de chaîne :

```typescript
import { surfaceDiffText } from '@flyingrobots/bijou-tui';

expect(surfaceDiffText(before, after)).toContain('surface diff: 2 changed');
```

Utilisez `layoutInspectorOverlay()` lorsqu'une assertion de mise en page a
besoin de la vérité géométrique visuelle par-dessus la frame rendue :

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

Utilisez `evaluateSurfaceBudget()` directement dans les tests ou passez
`surfaceBudget` à `run()` lorsqu'une application interactive doit émettre des
avertissements de runtime non fatals :

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

Utilisez `appendInputRoutingRecord()` et `inputRoutingInspectorText()` lorsqu'un
shell ou une application veut garder visibles les dernières décisions de
routage :

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

Utilisez `createInputGestureRecognizer()` et `createInputActionMap()` lorsque
l'entrée brute doit devenir des gestes sémantiques avant le routage. Bijou
fournit des noms d'événements standard tels que `press`, `held`, `release`,
`tap`, `double-tap` et `long-press`, et permet aux applications de fournir leurs
propres chaînes de type d'événement.

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

Utilisez `focusMapText()` ou `focusMapSurface()` lorsque la propriété du focus et
l'ordre de tabulation nécessitent le même traitement déterministe :

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

## Polices raster

`RasterFont` stocke une couverture de glyphes et des métriques d'avance validées
et immuables. `layoutRasterText()` expose des glyphes positionnés pour des
effets tels que le cylindre de DOGFOOD. `rasterizeText()` renvoie une frame RGBA
noir sur transparent, tandis que `rasterTextSurface()` transmet cette couverture
au moteur de rendu existant en Braille, en blocs de quadrants ou en caractères
personnalisés.

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

Les bits de couverture sont parcourus ligne par ligne, bit de poids faible en
premier. Les métriques partagent un même système de coordonnées : `left` et
`top` sont des approches relatives à l'origine du glyphe ; `advance` déplace
l'origine suivante. Les approches négatives et le texte multiligne sont
préservés. Une police possède une copie de sa table de correspondance et chaque
glyphe possède son masque. Les points de code inconnus lèvent une exception sauf
si la police désigne explicitement un glyphe de repli. Cette première API
effectue une mise en page par point de code, sans façonnage, bidi ni crénage. Un
texte vide produit une frame RGBA transparente de 1 × 1, de sorte qu'il peut
passer directement par `rasterToGlyphSurface()`. Les couleurs de surface
proviennent de `fg` et `bg` ; la couverture est monochrome et n'utilise pas
l'échantillonnage des couleurs du moteur de rendu d'images.

Lors de la réduction de la couverture des glyphes, le rastériseur de texte
préserve chaque texel couvert de l'atlas en marquant les pixels de sortie qu'il
chevauche. Les fûts et barres fins survivent donc entre les centres des pixels de
sortie. Aux petites tailles, cela peut arrondir un trait à un pixel ou fermer un
écart inférieur à un pixel. L'agrandissement conserve une couverture au plus
proche voisin. Le budget de travail inclut les visites de l'atlas et les
écritures de pixels projetées ainsi que l'échantillonnage de sortie.

Les surfaces de texte Braille et en quadrants conservent par défaut toute
couverture non nulle lors de l'ajustement à la grille du terminal. Un `threshold`
explicite du moteur de rendu remplace ce comportement par défaut. Les jeux de
caractères personnalisés conservent la correspondance de densité du moteur de
rendu d'images.

Fournissez une couverture précompilée ; le moteur de rendu ne charge pas de
fichiers TTF, n'installe pas de polices et n'effectue pas de requêtes réseau. Le
générateur Jacquard 12 de DOGFOOD illustre l'extraction OpenType hors ligne et
conserve la licence de la police sous `assets/fonts/`. Conservez une alternative
textuelle lisible pour les informations essentielles dans les présentations pipe
et accessible : le lettrage raster est une illustration.

Le rendu refuse plus de 20 000 unités de code en entrée, 1 048 576 pixels alloués
ou 16 777 216 échantillons de glyphes. La sortie de surface est limitée à
131 072 cellules, 4 096 colonnes et 1 024 lignes. La hauteur des pixels de
sortie doit être un entier de 1 à 4 096. L'appelant choisit sa propre politique
de cache ; la bibliothèque n'a pas de cache de polices global.

## Documentation

- **[GUIDE.md](./GUIDE.md)** : le chemin le plus rapide et productif pour construire des applications.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)** : doctrine du shell, shaders et fonctionnement interne de l'animation.
- **[Guide du pipeline de rendu](../../docs/book/bijou-designs.pdf#page=332)** : ordre des étapes, `RenderState` et vérité de `configurePipeline()`.
- **[Design system](../../docs/book/bijou-designs.pdf#page=338)** : conseils sémantiques et modèles.

---
Construit avec 💎 par [FLYING ROBOTS](https://github.com/flyingrobots)
