---
title: "Cómo crear tus propios Blocks"
summary: "El contrato de autoría de Blocks: metadatos primero, adaptadores de esquema en los límites y comandos como intención."
---

# Cómo crear tus propios Blocks

Los Blocks se crean primero como contratos públicos. Un Block debe poder descubrirse
antes de renderizarse, y un paquete debe poder publicar los metadatos de sus Blocks
sin depender del registro en tiempo de importación.

## Ciclo de autoría

1. Define los metadatos del Block.
2. Declara slots, variantes, modos, ejemplos y datos semánticos.
3. Añade contratos de datos solo cuando el Block necesite entradas respaldadas por un proveedor.
4. Declara intenciones de comando para las acciones del usuario.
5. Añade un adaptador de esquema cuando datos desconocidos en un límite necesiten validación.
6. Exporta el Block e inclúyelo en un manifiesto de paquete.

## Vincula CounterDemoBlock en una app

La app es dueña del estado CounterDemoModel. El Block sigue siendo reutilizable: recibe
la configuración en tiempo de renderizado y emite datos de intención de comando, mientras la aplicación
decide cómo cambia el estado.

El patrón de vinculación:

1. La app es dueña del estado `CounterDemoModel`.
2. Las teclas de la app se convierten en intenciones de comando mediante `counterDemoIntentForKey()`.
3. La app aplica los datos de intención mediante `applyCounterDemoIntent()`.
4. El renderizado deriva `counterDemoBlockConfig()` del estado de la app.
5. `counterDemoBlockSurface()` convierte esa configuración en salida de terminal.
6. Los modos `pipe` y `accessible` siguen describiendo el valor cuando no existe un bucle de teclas.

```ts
import type { BijouContext, Surface } from '@flyingrobots/bijou';
import {
  applyCounterDemoIntent,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoIntentForKey,
  createCounterDemoModel,
  tickCounterDemoModel,
  type CounterDemoModel,
} from '../counter-block-demo.js';

interface CounterAppModel {
  readonly counterBlock: CounterDemoModel;
}

export function initCounterApp(): CounterAppModel {
  return {
    counterBlock: createCounterDemoModel(5),
  };
}

export function updateCounterApp(
  model: CounterAppModel,
  key: string,
): CounterAppModel {
  const intent = counterDemoIntentForKey(key);
  if (intent === undefined) return model;

  return {
    ...model,
    counterBlock: applyCounterDemoIntent(model.counterBlock, intent),
  };
}

export function tickCounterApp(
  model: CounterAppModel,
  deltaMs: number,
): CounterAppModel {
  return {
    ...model,
    counterBlock: tickCounterDemoModel(model.counterBlock, deltaMs),
  };
}

export function viewCounterApp(
  model: CounterAppModel,
  ctx: BijouContext,
  width: number,
): Surface {
  return counterDemoBlockSurface(
    counterDemoBlockConfig(model.counterBlock, ctx, width),
  );
}
```

## Forma mínima

```ts
import {
  commandIntent,
  defineBlock,
  defineBlockPackage,
  defineDataRequirement,
  defineViewData,
} from '@flyingrobots/bijou';

const article = defineDataRequirement({
  id: 'docs.article',
  resource: 'docs.article',
});

const readerData = defineViewData({
  id: 'reader.data',
  requirements: [{ name: 'article', requirement: article }],
});

export const readerBlock = defineBlock({
  metadata: {
    packageName: '@example/blocks',
    blockName: 'Reader',
    family: 'reading',
    scale: 'section',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: {
      summary: 'Renders validated article content.',
    },
    slots: [{ id: 'content', required: true }],
  },
  data: readerData,
  commands: [
    commandIntent('reader.selectHeading', {
      label: 'Select heading',
    }),
  ],
  render: ({ slots }) => ({
    output: String(slots?.content ?? ''),
  }),
});

export const manifest = defineBlockPackage({
  packageName: '@example/blocks',
  version: '1.0.0',
  bijouPeerRange: '^5.0.0',
  blocks: ['Reader'],
});
```

## Límites

Los Blocks ligados a un esquema validan la forma en el límite. El flujo de datos ligado a proveedores es
independiente: los proveedores publican instantáneas inmutables, los frames entregan datos en tiempo
de renderizado y los comandos expresan la intención del usuario de vuelta a la lógica de negocio.

No pongas handles de proveedor, handles de suscripción, métodos de refresco, callbacks de
dispatch ni almacenes mutables ocultos en la entrada de renderizado de un Block.
