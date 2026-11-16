---
title: "@flyingrobots/bijou-node"
summary: "Adaptateurs Node pour le runtime, les E/S, le style, les workers et l’enregistreur des applications Bijou."
---
# @flyingrobots/bijou-node

Adaptateurs Node.js et utilitaires d’exécution pour Bijou.

`@flyingrobots/bijou-node` relie le cœur pur et le runtime TUI à l’environnement Node.js. Il prend en charge la détection de plateforme, les E/S du terminal, le style fondé sur Chalk et les utilitaires de worker threads.

## Rôle

- **Implémentation des ports** : associe les API Node.js aux interfaces de ports de Bijou.
- **Runtime de workers** : délègue la logique TEA lourde à des worker threads tout en préservant la réactivité du thread principal.
- **Amorçage** : démarrage d’une application hébergée en un seul appel avec `startApp()`.
