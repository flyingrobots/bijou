---
title: "@flyingrobots/bijou"
summary: "La boîte à outils centrale pure : invites, Composants, thèmes, ports et primitives de surface."
---
# @flyingrobots/bijou

Le cœur pur et sans dépendance de Bijou.

`@flyingrobots/bijou` fournit les primitives fondamentales pour les CLI, les invites et la sortie terminal portable. Il gère les Composants, les thèmes, la détection de l'environnement ainsi que les types centraux `Surface` et `LayoutNode`.

## Rôle

- **La dégradation d'abord** : détection automatique du mode pour les sorties `interactive`, `static`, `pipe` et `accessible`.
- **Modes mixtes** : primitives `Surface` hautes performances pour les applications TUI riches, avec
  des utilitaires orientés chaînes pour les scripts CLI autonomes.
- **Des primitives de surface sans abandonner les chaînes** : les applications du runtime peuvent rester sur
  le chemin des surfaces, tandis que les parcours orientés CLI utilisent toujours les utilitaires orientés chaînes.
- **Cœur hexagonal** : logique TypeScript pure isolée des E/S de la plateforme via les ports `Runtime`, `IO` et `Style`.
