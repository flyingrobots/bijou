---
title: "Vue d'ensemble du design system"
summary: "Les fondations, les modèles, les Blocks et la doctrine des familles de Composants qui sous-tendent l'interface de Bijou."
---
# Le design system de Bijou

Bijou couvre désormais un périmètre suffisamment large pour que « voici les exports » ne soit plus une bonne stratégie de documentation.

Cette section définit le langage de conception qui sous-tend la bibliothèque :

- les fondations qui façonnent l'interface
- le vocabulaire de jetons qui transforme la doctrine des couleurs en règles d'API
- les modèles d'interaction et de mise en page récurrents d'une application à l'autre
- les familles de Composants et le rôle prévu de chacune
- la politique de visualisation des données, au lieu d'improviser à chaque fois

Elle se veut délibérément plus proche d'un guide de design system que d'une référence d'API.

## À quoi sert cette section

Utilisez ces docs lorsque vous devez répondre aux questions suivantes :

- Quel problème cette famille de Composants résout-elle ?
- Quelle variation dois-je utiliser ?
- Quelle famille de jetons ce Composant doit-il utiliser ?
- Quand choisir un Composant plutôt qu'un autre ?
- Quand éviter complètement ce Composant ?
- Cela relève-t-il du cœur `@flyingrobots/bijou` ou de `@flyingrobots/bijou-tui` ?
- Comment cela doit-il se dégrader entre les exécutions interactive, statique, pipe et accessible ?
- Quel est l'équivalent, pensé d'abord pour le terminal, d'un modèle de design system desktop ou web ?

## Lire dans cet ordre

1. [Fondations](./foundations.md)
2. [Vocabulaire des jetons de thème](./theme-tokens.md)
3. [Guide de création de thèmes](./theme-authoring.md)
4. [Recettes de règles de thème](./theme-rule-recipes.md)
5. [Modèles](./patterns.md)
6. [Blocks](./blocks.md)
7. [Politique du pointeur et de la souris](./pointer.md)
8. [Familles de Composants](./component-families.md)
9. [Politique de visualisation des données](./data-visualization.md)

Pour l'inventaire brut et le travail de taxonomie derrière ces docs, voir [../archive/component-system-audit.md](../archive/component-system-audit.md).

## Idées fondamentales du système

### Bijou n'est pas qu'une bibliothèque de Composants

Bijou se compose de cinq couches :

1. **Fondations**
  - couleur, rythme d'espacement, hiérarchie du texte, débordement, animation, focus, interruption
2. **Vocabulaire de thème**
  - familles de jetons canoniques et règles d'usage first-party
3. **Modèles**
  - statut, sélection, navigation, superpositions, formulaires, composition du shell
4. **Familles de Composants**
  - primitives concrètes qui implémentent ces modèles
5. **Blocks**
  - assemblages réutilisables au niveau produit, tels que des cadres d'application, des parcours de paramètres et des workflows guidés

Les Composants et les Blocks doivent découler des trois premières couches. Si le
langage de conception est faible, le catalogue de Composants comme la
bibliothèque de Blocks deviennent confus, quel que soit le nombre d'exports.

### Propriété : cœur ou TUI

- `@flyingrobots/bijou` possède la sémantique qui survit à la dégradation.
- `@flyingrobots/bijou-tui` possède le focus, l'animation, les superpositions, le comportement du shell, le défilement, l'historique et les autres interactions fortement liées au cycle de vie.

Cela signifie que :

- `alert()` relève du cœur.
- `toast()` relève de la TUI.
- les notifications relèvent de la TUI, car il s'agit d'un système et pas seulement d'un rendu.

### Toutes les variations ne se valent pas

Bijou utilise trois sortes de variations :

- **variantes sémantiques**
  - par exemple le ton ou la gravité d'un statut
- **variantes de couche d'interaction**
  - par exemple `accordion()` par rapport à `interactiveAccordion()`
- **variantes de chemin de rendu**
  - par exemple `box()` par rapport à `boxSurface()`

Seule la première sorte est une « variante visuelle » au sens habituel d'un design system. Les deux autres existent parce que Bijou doit survivre à différentes couches d'interaction et de rendu.

### La dégradation élégante est une contrainte de conception de premier rang

Chaque famille doit répondre aux questions suivantes :

- À quoi cela ressemble-t-il dans un terminal interactif riche ?
- Qu'est-ce qui reste vrai dans une sortie CI statique ?
- Qu'est-ce qui reste vrai en mode pipe ?
- Qu'est-ce qui se simplifie en mode accessible ?

Si un Composant ne peut pas répondre à cette question, sa place est probablement dans `@flyingrobots/bijou-tui`, pas dans le cœur.

## Norme de documentation

Chaque page aboutie de famille de Composants dans Bijou doit inclure :

- Ce que c'est
- Variations
- Quand l'utiliser
- Quand ne pas l'utiliser
- Conseils de contenu
- Propriété de l'interaction
- Chemin de dégradation élégante
- Familles associées

Le guide des familles de Composants respecte désormais ce socle structurel, et sa structure est vérifiée par un script de prévalidation du dépôt. Cette prévalidation est volontairement structurelle : elle vérifie les sections de famille requises et la couverture des modes de dégradation élégante dans le guide des familles. L'exactitude sémantique, la dérive entre docs de packages et d'exemples, et la complétude de la documentation des Composants modifiés restent des responsabilités de revue, que le script actuel ne peut pas prouver automatiquement.

## Contrôle des modifications de Composants

À partir du nettoyage pure-surface de la v4, toute modification d'une famille de Composants doit être évaluée par rapport aux docs dans la même tranche de travail.

Pour chaque Composant ou famille de Composants modifié, vérifiez que :

- la documentation existe
- les variantes documentées sont à jour
- les conseils `When to use` sont présents et toujours exacts
- les conseils `When not to use` sont présents et toujours exacts
- la propriété cœur ou TUI est explicite
- la dégradation élégante est documentée pour `rich`, `static`, `pipe` et `accessible` le cas échéant
- les familles associées sont listées

La prévalidation CI impose le minimum structurel pour le guide des familles. Si l'une des vérifications plus larges ci-dessus manque ou est substantiellement erronée, les docs restent incomplètes, et cette lacune doit être corrigée dans la même tranche ou explicitement consignée comme dette de backlog avant que le travail ne soit considéré comme terminé.

## Lacunes actuelles que cette section doit combler

Bijou est déjà solide en matière d'étendue et d'architecture du runtime. Les points plus faibles sont :

- des conseils d'usage explicites
- la documentation au niveau des familles
- la complétude de la documentation par rapport à la norme définie ci-dessus
- l'aide à la décision au niveau des modèles
- la doctrine de visualisation des données
- la politique de la souris et des entrées multiples

Ces docs existent pour corriger cela.
