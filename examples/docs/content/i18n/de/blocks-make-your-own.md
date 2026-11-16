---
title: "Eigene Blocks erstellen"
summary: "Der Vertrag für das Erstellen von Blocks: Metadaten zuerst, Schema-Adapter an Grenzen und Befehle als Intent."
---
# Eigene Blocks erstellen

Blocks werden zuerst als öffentliche Verträge geschrieben. Ein Block sollte auffindbar
sein, bevor er rendert, und ein Paket sollte Block-Metadaten veröffentlichen können,
ohne auf Registrierung beim Import angewiesen zu sein.

## Ablauf beim Erstellen

1. Definiere die Block-Metadaten.
2. Deklariere Slots, Varianten, Modi, Beispiele und semantische Fakten.
3. Füge Datenverträge nur hinzu, wenn der Block providergestützte Eingaben braucht.
4. Deklariere Befehls-Intents für Benutzeraktionen.
5. Füge einen Schema-Adapter hinzu, wenn unbekannte Daten an der Grenze validiert werden müssen.
6. Exportiere den Block und nimm ihn in ein Paketmanifest auf.

## CounterDemoBlock in einer App binden

Die App besitzt den Zustand von CounterDemoModel. Der Block bleibt wiederverwendbar: Er erhält
Konfiguration zur Renderzeit und gibt Fakten zu Befehls-Intents aus, während die Anwendung
entscheidet, wie sich der Zustand ändert.

Das Bindungsmuster:

1. Die App besitzt den Zustand von `CounterDemoModel`.
2. Tasten der App werden über `counterDemoIntentForKey()` zu Befehls-Intents.
3. Die App wendet Intent-Fakten über `applyCounterDemoIntent()` an.
4. Das Rendering leitet `counterDemoBlockConfig()` aus dem App-Zustand ab.
5. `counterDemoBlockSurface()` macht aus dieser Konfiguration Terminalausgabe.
6. Die Modi `pipe` und `accessible` beschreiben den Wert auch dann, wenn keine Tastenschleife existiert.

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

## Minimale Form

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

## Grenzen

Schemagebundene Blocks validieren die Form an der Grenze. Der providergebundene Datenfluss ist
davon getrennt: Provider veröffentlichen unveränderliche Snapshots, Frames liefern Daten zur
Renderzeit, und Befehle melden die Absicht des Benutzers an die Geschäftslogik zurück.

Lege keine Provider-Handles, Abonnement-Handles, Refresh-Methoden, Dispatch-
Callbacks oder versteckten veränderlichen Stores in die Render-Eingabe eines Blocks.
