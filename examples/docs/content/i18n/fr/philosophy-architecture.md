---
title: "Architecture"
summary: "La référence structurelle de l’espace de travail à neuf paquets et de ses couloirs core/runtime/i18n."
---
# ARCHITECTURE

Ceci est le court repère d’architecture de la surface de documentation.

Bijou est un monorepo de neuf paquets pour le logiciel de terminal en TypeScript. Le
[ARCHITECTURE.md](../ARCHITECTURE.md) racine est le point d’entrée principal, mais DOGFOOD et
le couloir de documentation ont tout de même besoin ici d’un résumé propre au dépôt.

## Structure

- `@flyingrobots/bijou` possède le cœur pur : invites, thèmes, composants et
  surfaces
- `@flyingrobots/bijou-tui` possède le runtime plein écran, la mise en page, le mouvement,
  les superpositions et le shell encadré
- `@flyingrobots/bijou-node` possède la frontière terminal/processus, le runtime
  de workers et l’enregistreur
- les paquets i18n possèdent les catalogues d’exécution ainsi que les flux de travail
  de rédaction et d’échange de la localisation

## À lire ensuite

- [repère d’architecture racine](../ARCHITECTURE.md)
- [architecture du runtime](../packages/bijou-tui/ARCHITECTURE.md)
- [architecture de node](../packages/bijou-node/ARCHITECTURE.md)
- [architecture du cœur](../packages/bijou/ARCHITECTURE.md)
