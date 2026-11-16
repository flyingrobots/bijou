---
title: "Vue d’ensemble des paquets"
summary: "Comment les paquets publics de l’espace de travail s’articulent dans la pile Bijou."
---
# Paquets

Cette section est le guide des paquets de l’espace de travail publié de Bijou.

## Carte actuelle des paquets

- `@flyingrobots/bijou` — surfaces du cœur, jetons, utilitaires de mise en page et composants
- `@flyingrobots/bijou-node` — adaptateurs Node pour le runtime et le style
- `@flyingrobots/bijou-tui` — shell encadré et runtime d’applications de terminal
- `@flyingrobots/bijou-tui-app` — utilitaires d’application et échafaudage du shell
- `create-bijou-tui-app` — modèle de projet et flux de démarrage
- `@flyingrobots/bijou-i18n*` — runtime, outils et adaptateurs de localisation
- `@flyingrobots/bijou-mcp` — rendu des composants et données sémantiques pour les clients MCP

## Comment utiliser cette section

- utilisez le volet de gauche pour ouvrir le paquet qui vous intéresse
- utilisez le volet central pour lire le rôle du paquet et le guide de sa surface
- utilisez le volet de droite pour un bref résumé de la finalité de cette page

Les pages de paquets de cette section sont publiées à partir de la vraie
documentation de l’espace de travail du dépôt, afin que DOGFOOD puisse servir de
véritable guide des paquets plutôt que de simple page d’accueil provisoire.

Le paquet TUI possède l’API immuable de polices matricielles. Le décodage des polices, les
téléchargements depuis Google Fonts et les réglages typographiques par élément se trouvent dans l’exemple Markdown ;
ce ne sont pas des fonctionnalités de chargement TTF automatique du moteur de rendu pur. Voir
**Guides → Latest Features** et `examples/markdown-font/README.md`.
