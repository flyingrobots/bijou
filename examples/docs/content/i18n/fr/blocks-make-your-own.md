---
title: "Comment créer vos propres Blocks"
summary: "Le contrat de création des Blocks : les métadonnées d'abord, des adaptateurs de schéma aux frontières et des commandes exprimant une intention."
---
# Comment créer vos propres Blocks

Les Blocks sont d'abord rédigés comme des contrats publics. Un Block doit être
découvrable avant d'être rendu, et un package doit pouvoir publier les
métadonnées de ses Blocks sans dépendre d'un enregistrement au moment de
l'import.

## Boucle de création

1. Définissez les métadonnées du Block.
2. Déclarez les emplacements, les variantes, les modes, les exemples et les faits sémantiques.
3. N'ajoutez des contrats de données que si le Block a besoin d'entrées fournies par un fournisseur.
4. Déclarez des intentions de commande pour les actions de l'utilisateur.
5. Ajoutez un adaptateur de schéma lorsque des données inconnues à la frontière doivent être validées.
6. Exportez le Block et incluez-le dans un manifeste de package.

## Lier CounterDemoBlock dans une application

L'application possède l'état CounterDemoModel. Le Block reste réutilisable : il
reçoit une configuration au moment du rendu et émet des faits d'intention de
commande, tandis que l'application décide de la façon dont l'état change.

Le modèle de liaison :

1. L'application possède l'état `CounterDemoModel`.
2. Les touches de l'application deviennent des intentions de commande via `counterDemoIntentForKey()`.
3. L'application applique les faits d'intention via `applyCounterDemoIntent()`.
4. Le rendu dérive `counterDemoBlockConfig()` de l'état de l'application.
5. `counterDemoBlockSurface()` transforme cette configuration en sortie terminal.
6. Les modes pipe et accessible décrivent toujours la valeur lorsqu'aucune boucle de touches n'existe.

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

## Forme minimale

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

## Frontières

Les Blocks liés à un schéma valident la forme à la frontière. Le flux de données
lié à un fournisseur est distinct : les fournisseurs publient des instantanés
immuables, les frames livrent les données au moment du rendu, et les commandes
renvoient l'intention de l'utilisateur vers la logique métier.

Ne placez pas de handles de fournisseur, de handles d'abonnement, de méthodes de
rafraîchissement, de callbacks de dispatch ni de stores mutables cachés dans
l'entrée de rendu d'un Block.
