---
title: "@flyingrobots/bijou-tui"
summary: "El runtime a pantalla completa: bucle TEA, layout, movimiento, superposiciones e infraestructura de shell."
---

# @flyingrobots/bijou-tui

El runtime TEA de alta fidelidad para Bijou.

`@flyingrobots/bijou-tui` proporciona el bucle de aplicación, las primitivas de layout y la orquestación basada en física necesarios para construir apps de terminal interactivas complejas.

## Función

- **The Elm Architecture (TEA)**: un bucle determinista de estado-actualización-vista para software de terminal de nivel industrial.
- **TEA fractal**: compón sub-apps anidadas con `createSubAppAdapter()`, `initSubApp()`, `updateSubApp()` y `mount()`.
- **Movimiento declarativo**: interpola los cambios de layout con suavidad mediante muelles basados en física y animaciones tween.
- **Pipeline centrado en Surface**: middleware de renderizado programable para fragmentos, diffing y transiciones basadas en shaders.

## Instalación

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Inicio rápido (composición de sub-apps)

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

En hosts de Node, prefiere `startApp()` para la ruta de la primera app. Recurre a
`run(app, { ctx })` cuando el host se encargue explícitamente de crear el contexto.

Cuando necesites mezclar pequeños fragmentos de cadena con primitivas que devuelven Surfaces,
mantén la composición del lado de la Surface: usa `contentSurface()` directamente o pasa
cadenas a `vstackSurface()` / `hstackSurface()`. Las cadenas en bruto siguen sin ser un
tipo de retorno válido para `view()`.

Usa `proseSurface(text, { width })` cuando un texto de tipo párrafo deba ajustarse en
los límites de palabra antes de convertirse en una Surface. Reserva `contentSurface()` para
salida preformateada, tablas, cajas y saltos de línea gestionados por quien llama.

## Estrategia: elegir familias de Componentes

Elige la familia según la semántica de la interacción.

### Superposiciones e interrupción
- **`drawer()`**: detalle complementario sin perder el contexto principal.
- **`modal()`**: decisión obligatoria que bloquea la actividad de fondo.
- **`toast()`**: notificación transitoria para un único evento.
- **`tooltip()`**: microexplicación para un objetivo local.
- **`debugOverlay()`**: HUD de rendimiento solo para desarrollo, compuesto sobre cualquier Surface de app.
- **`layoutInspectorOverlay()`**: HUD de geometría solo para desarrollo con los límites
  de regiones, el foco y las capas.
- **`inputRoutingInspectorText()`**: traza de rutas solo para desarrollo de los eventos
  recientes de teclado y puntero.
- **`focusMapText()`**: informe solo para desarrollo de la propiedad del foco y el orden de tabulación.
- **`evaluateSurfaceBudget()`**: avisos deterministas para umbrales de Surface y
  de tiempo.
- **`surfaceDiffSurface()`**: inspección lado a lado o superpuesta de dos Surfaces renderizadas.

### Interacción con colecciones
- **`navigableTable()`**: recorrido guiado por teclado e inspección de celdas.
- **`browsableList()`**: recorrido en una dimensión guiado por descripciones.
- **`commandPalette()`**: descubrimiento de acciones y navegación.

### Layout de shell y espacio de trabajo
- **`createFramedApp()`**: espacio de trabajo completo con pestañas, paneles,
  ayuda y un HUD de rendimiento propio del shell que se alterna con la tecla de acento grave.
- **`splitPane()`**: comparación dinámica de contexto principal/secundario.
- **`grid()`**: regiones estables con visibilidad simultánea.
- **`viewport()`**: la máscara de desplazamiento canónica para composiciones ricas.

Para shells enmarcados, los hosts de Node pueden seguir prefiriendo `startApp(app)`: el arranque
de Node alojado delega automáticamente en las apps enmarcadas que se ejecutan solas. Usa la
ruta explícita del runner cuando quieras quedarte dentro de `@flyingrobots/bijou-tui`
o cuando el host sea dueño de `ctx` directamente:

```typescript
import { createFramedApp, runFramedApp } from '@flyingrobots/bijou-tui';

const app = createFramedApp({ pages: [page] });

await app.run({ ctx });
// or: await runFramedApp({ pages: [page] }, { ctx });
```

Esta ruta mantiene el shell completo: la entrada de ratón es `true` por defecto,
el bucle de runtime compartido sigue haciendo el trabajo pesado y la telemetría de tiempos/presupuesto
del frame permanece ligada al modelo de frame para la UI propia del shell. Para apps
alojadas en Node, `startApp(app)` sigue siendo el arranque predeterminado.

## Diagnóstico del runtime

El EventBus expone datos de la cola de comandos mediante `getCommandDiagnostics()`.
`run(app, { commandBackpressureThreshold })` enruta un aviso cuando los comandos
pendientes superan el umbral, sin limitar de forma estricta las ráfagas legítimas. El
umbral predeterminado es 1000; usa `0` para desactivar el aviso.

El middleware del pipeline de renderizado es síncrono por contrato. Si un middleware devuelve una
Promise, Bijou informa de un diagnóstico del pipeline, mantiene en marcha el frame actual
e ignora cualquier continuación tardía de `next()` para que el orden de las etapas siga siendo
determinista.

## Animación

### Física de muelles
```typescript
import { animate, SPRING_PRESETS } from '@flyingrobots/bijou-tui';

const cmd = animate({
  from: 0,
  to: 100,
  spring: 'wobbly',
  onFrame: (v) => ({ type: 'scroll', y: v }),
});
```

Los comandos de muelle integran la física con pasos de tiempo fijos y acotados por defecto, de modo que un
frame lento de la terminal no puede inyectar un gran delta de pulso en bruto en el muelle. Ajusta
`fixedStepSeconds` y `maxPulseSeconds` solo cuando una app necesite una cadencia de
simulación personalizada.

### Orquestación con líneas de tiempo
```typescript
import { timeline } from '@flyingrobots/bijou-tui';

const tl = timeline()
  .add('slideIn', { type: 'tween', from: -100, to: 0, duration: 300 })
  .label('settled')
  .add('bounce', { from: 0, to: 10, spring: 'wobbly' }, 'settled')
  .build();
```

## Shaders de posprocesado

`canvas()` puede renderizar Surfaces procedurales a resolución de celda, Quad, Braille o ajuste
de glifo. Usa `resolution: 'glyph'` cuando un shader deba muestrear una cuadrícula de 2x4 pero
condensarla en caracteres Unicode o ASCII conscientes de la geometría en lugar de Braille.

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

Usa `surfaceShaderFilter(...)` para componer pasadas de posprocesado integradas como
`scanlines()`, `flicker()`, `noise()` y `vignette()` sobre la Surface de destino
empaquetada antes del diff/salida.

## Pruebas

Usa `testRuntime()` cuando quieras un arnés inspeccionable en lugar del
resultado de un script de una sola ejecución:

```typescript
import { testRuntime } from '@flyingrobots/bijou-tui';

const harness = await testRuntime(app, { ctx });
await harness.press('q');

expect(harness.frame).toBeDefined();
expect(harness.messages).toHaveLength(1);
expect(harness.commands.every((record) => record.settled)).toBe(true);

await harness.teardown();
```

Reserva `runScript()` para la reproducción de interacciones tipo fixture y la captura de GIF/demos,
y usa `testRuntime()` cuando necesites aserciones directas sobre
instantáneas, mensajes emitidos, resultados de comandos o la liberación en la limpieza.

La reproducción de ratón puede usar pasos auxiliares en lugar de objetos `MouseMsg`
escritos a mano. `sgrMouse()` analiza secuencias de ratón SGR en bruto cuando una regresión debe
coincidir directamente con los bytes de entrada de la terminal.

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

Para integraciones de apps enmarcadas que necesiten envolver o enrutar comandos de nivel de página,
importa los helpers de frame con ámbito de página desde la raíz del paquete:

```typescript
import { PAGE_MSG_TOKEN, emitMsgForPage, isPageScopedMsg, wrapCmdForPage, wrapPageMsg } from '@flyingrobots/bijou-tui';
```

Usa `surfaceDiffText()` o `surfaceDiffSurface()` cuando falle una aserción de frame
y necesites la verdad a nivel de celda en lugar de un volcado de cadena en bruto:

```typescript
import { surfaceDiffText } from '@flyingrobots/bijou-tui';

expect(surfaceDiffText(before, after)).toContain('surface diff: 2 changed');
```

Usa `layoutInspectorOverlay()` cuando una aserción de layout necesite la verdad de la geometría
visual sobre el frame renderizado:

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

Usa `evaluateSurfaceBudget()` directamente en las pruebas o pasa `surfaceBudget` a
`run()` cuando una app interactiva deba enrutar avisos de runtime no fatales:

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

Usa `appendInputRoutingRecord()` e `inputRoutingInspectorText()` cuando un shell
o una app quiera mantener visibles las últimas decisiones de enrutamiento:

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

Usa `createInputGestureRecognizer()` y `createInputActionMap()` cuando la entrada en bruto
deba convertirse en gestos semánticos antes del enrutamiento. Bijou incluye nombres estándar de
eventos de función como `press`, `held`, `release`, `tap`, `double-tap`,
`long-press`, y permite a las apps aportar sus propias cadenas de tipo de evento.

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

Usa `focusMapText()` o `focusMapSurface()` cuando la propiedad del foco y el orden de tabulación
necesiten el mismo tratamiento determinista:

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

## Fuentes raster

`RasterFont` almacena la cobertura de glifos y las métricas de avance validadas e inmutables.
`layoutRasterText()` expone glifos posicionados para efectos como el cilindro
de DOGFOOD. `rasterizeText()` devuelve un frame RGBA negro sobre transparente, mientras que
`rasterTextSurface()` envía esa cobertura a través del renderizador existente de Braille, de
bloques de cuadrante o de caracteres personalizados.

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

Los bits de cobertura van fila a fila, empezando por el bit menos significativo. Las métricas comparten un
mismo sistema de coordenadas: `left` y `top` son los desplazamientos respecto al origen del glifo;
`advance` mueve el siguiente origen. Se conservan los desplazamientos negativos y el texto
multilínea. Una fuente es dueña de una copia de su tabla de búsqueda y cada glifo es dueño de su máscara.
Los puntos de código desconocidos lanzan un error salvo que la fuente nombre explícitamente un glifo alternativo.
Esta primera API hace el layout por puntos de código, sin shaping, bidi ni kerning.
El texto vacío produce un frame RGBA transparente de 1 × 1, así que puede pasar directamente
por `rasterToGlyphSurface()`. Los colores de la Surface vienen de `fg` y `bg`;
la cobertura es monocroma y no usa el muestreo de color del renderizador de imágenes.

Al reducir la cobertura de glifos, el rasterizador de texto conserva cada téxel cubierto del atlas
marcando los píxeles de salida que solapa. Así, los trazos y barras finos
sobreviven entre los centros de los píxeles de salida. A tamaños pequeños esto puede redondear un trazo
hasta un píxel o cerrar un hueco menor de un píxel. La ampliación conserva la
cobertura por vecino más cercano. El presupuesto de trabajo incluye las visitas al atlas y las escrituras
de píxeles proyectadas, además del muestreo de salida.

Las Surfaces de texto en Braille y en cuadrantes conservan por defecto cualquier cobertura distinta de cero
al ajustarse a la cuadrícula de la terminal. Un `threshold` explícito del renderizador sustituye
ese valor predeterminado. Los conjuntos de caracteres personalizados conservan el mapeo de densidad del renderizador de imágenes.

Proporciona cobertura precompilada; el renderizador no carga archivos TTF, no instala fuentes
ni hace peticiones de red. El generador de Jacquard 12 de DOGFOOD muestra la extracción
OpenType sin conexión y conserva la licencia de la fuente en `assets/fonts/`.
Mantén una alternativa textual legible para la información esencial en las presentaciones `pipe` y
`accessible`: las letras raster son una ilustración.

El renderizado rechaza más de 20.000 unidades de código de entrada, 1.048.576 píxeles asignados
o 16.777.216 muestras de glifo. La salida de Surface se limita a 131.072 celdas, 4.096
columnas y 1.024 filas. La altura en píxeles de salida debe ser un entero de 1 a 4.096.
Quien llama elige su propia política de caché; la biblioteca no tiene caché global de fuentes.

## Documentación

- **[GUIDE.md](./GUIDE.md)**: la ruta rápida y productiva para construir apps.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: doctrina del shell, shaders y detalles internos del movimiento.
- **[Guía del pipeline de renderizado](../../docs/book/bijou-designs.pdf#page=332)**: orden de las etapas, `RenderState` y la verdad de `configurePipeline()`.
- **[Sistema de diseño](../../docs/book/bijou-designs.pdf#page=338)**: guía semántica y patrones.

---
Hecho con 💎 por [FLYING ROBOTS](https://github.com/flyingrobots)
