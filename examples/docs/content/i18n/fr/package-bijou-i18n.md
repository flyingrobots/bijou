---
title: "@flyingrobots/bijou-i18n"
summary: "Le runtime de localisation en mémoire pour les catalogues, le sens d’écriture et les recherches sûres à l’exécution."
---
# @flyingrobots/bijou-i18n

Le runtime de localisation en mémoire de Bijou.

`@flyingrobots/bijou-i18n` fournit :

- des catalogues organisés en espaces de noms
- la locale et le sens d’écriture
- la recherche de messages
- la recherche générique de ressources
- des références sûres à l’exécution
- des jointures de formatage sensibles à la locale
- des catalogues de repli explicites
- un formatage injectable des messages de localisation manquante
- la prise en charge de chargeurs de locale asynchrones pour l’activation de catalogues intégrée au runtime
- un `LocalizationPort` destiné aux applications, qui résout des objets
  localisés structurés
- `isJsonShapedLocalizedValue()` pour les vérifications de conformité des charges utiles
  ressource/données côté adaptateur

Ce paquet est volontairement limité à l’exécution. Les flux de travail sur tableur, la détection d’obsolescence, la pseudo-localisation et la compilation des catalogues relèvent de `@flyingrobots/bijou-i18n-tools`.

## Jointure de chargement

Utilisez `createI18nRuntime()` pour des catalogues entièrement préchargés, ou
`createI18nRuntimeAsync()` lorsque les catalogues doivent être chargés à la demande :

```ts
import { createI18nRuntimeAsync, type I18nCatalogLoader } from '@flyingrobots/bijou-i18n';

const loader: I18nCatalogLoader = async (locale) => {
  const module = await import(`./catalogs/${locale}.js`);
  return module.catalogs;
};

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader,
});
```

Lorsque les charges utiles d’exécution sont générées sous forme de catalogues purs par locale, chargez séparément
le catalogue source ou de repli :

```ts
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
```

Les applications de production peuvent utiliser des catalogues de repli pour des traductions manquantes lisibles.
Les applications de développement peuvent injecter `missingMessage` pour afficher un marqueur bien visible au lieu
de se rabattre silencieusement lorsqu’il manque une chaîne dans la locale sélectionnée :

```ts
const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
});
```

La même jointure de chargement prend aussi en charge des bundles de locale stockés dans des fichiers via
`@flyingrobots/bijou-i18n-tools-node` :

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createCatalogBundleFileLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createCatalogBundleFileLoader({
    resolvePath: (locale) => `./i18n/${locale}.json`,
  }),
});
```

Une fois créé, le runtime peut précharger et activer explicitement des locales :

```ts
await runtime.preloadLocale('de');
await runtime.setLocale('de');
```

## Port de localisation

Utilisez `LocalizationPort` aux frontières de l’application et des vues lorsque les appelants ont besoin d’un
objet localisé plutôt que d’un runtime concret :

```ts
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
} from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
const localization = createRuntimeLocalizationPort(runtime);

const title = localization.resolve({
  key: { namespace: 'app', id: 'title' },
});
```

`resolve()` renvoie un objet localisé figé contenant la clé, la locale, le sens d’écriture,
le type d’entrée, le statut traduit/repli/manquant, la valeur, les problèmes et les faits. Le
code de rendu reste ainsi à l’écart du chargement des catalogues, des chemins du système de fichiers, des données CSV et
des détails de mutation à l’exécution, tout en conservant assez d’état pour l’outillage et les modes
inférieurs.

## Charges utiles de ressources et de données

Les entrées de message se résolvent en chaînes. Les entrées `resource` et `data` se résolvent en
valeurs structurées portables, et le runtime fige ces valeurs avant de les transmettre
aux appelants.

Gardez des charges utiles ressource/données de forme JSON :

- chaînes, nombres, booléens, null et undefined
- tableaux ne comportant que des entrées indexées
- objets simples ne comportant que des propriétés de données énumérables

N’utilisez pas :

- d’instances de classe ni d’objets intégrés comme `Date`
- de propriétés à clé symbole
- de propriétés non énumérables
- de propriétés accesseurs
- de graphes d’objets cycliques
- de fonctions, de symboles ni de valeurs bigint

Les formes non prises en charge sont rejetées à la frontière de localisation plutôt que
normalisées silencieusement. Cela garde honnêtes les catalogues générés, les adaptateurs de chargement et
le code des vues : les adaptateurs doivent produire des données portables, et les consommateurs peuvent compter
sur le fait que les valeurs ressource/données localisées sont des instantanés immuables et non des poignées
d’exécution mutables.

Les adaptateurs peuvent vérifier les charges utiles avant de construire les catalogues :

```ts
import { isJsonShapedLocalizedValue } from '@flyingrobots/bijou-i18n';

if (!isJsonShapedLocalizedValue(payload)) {
  throw new Error('i18n resource/data payload must be JSON-shaped');
}
```

Les charges utiles ressource/données valides sont des données simples et denses :

```ts
const validResource = {
  label: 'Counter',
  range: { min: 0, max: 10 },
  marks: ['empty', 'half', 'full'],
};
```

Les charges utiles invalides sont rejetées au lieu d’être normalisées silencieusement :

```ts
class CounterResource {
  readonly label = 'Counter';
}

const sparse = new Array<string>(2);
sparse[1] = 'full';

const accessor = Object.defineProperty({}, 'label', {
  enumerable: true,
  get() {
    return 'Counter';
  },
});

isJsonShapedLocalizedValue(new CounterResource()); // false
isJsonShapedLocalizedValue(sparse); // false
isJsonShapedLocalizedValue(accessor); // false
```

## Documentation

Consultez le [dépôt Bijou](https://github.com/flyingrobots/bijou) pour la carte complète de la documentation, le guide d’architecture et le système de design.
