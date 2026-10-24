# @flyingrobots/bijou-mcp

Le serveur MCP expose les composants Bijou comme outils de rendu sur stdio.
Cet adaptateur pour clients MCP est distinct de l’application DOGFOOD plein écran.

```sh
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

Configurer le client MCP pour lancer `node` avec
`node_modules/@flyingrobots/bijou-mcp/bin/bijou-mcp.js` comme argument.
Les outils comprennent `bijou_table`, `bijou_tree`, `bijou_dag`, `bijou_box`,
`bijou_progress_bar`, des panneaux de navigation et de statut, et `bijou_docs`
pour le guide des composants lisible par machine.

Chaque outil accepte `output` : `text` renvoie le contenu rendu, `data` renvoie
le `structuredContent` MCP, et `both` renvoie les deux. Choisir les données
sémantiques si le consommateur a besoin de valeurs plutôt que d’art terminal.

Le serveur utilise une disposition interactive avec un adaptateur de style
simple. Cela n’équivaut pas au lowering pipe : `bijou_hyperlink` peut encore
émettre des contrôles OSC 8 dans ce checkout. L’issue #545 et la PR #546 suivent
ce comportement ; toutes les sorties ne sont pas garanties sans échappements.

Voir `packages/bijou-mcp/README.md` pour la configuration et la liste complète.
Vérifier le paquet en cours et le suivi avant de considérer un correctif ouvert
comme publié.
