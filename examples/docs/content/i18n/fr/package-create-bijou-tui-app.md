---
summary: "Le générateur de projet pour amorcer un projet d'application TUI Bijou exécutable."
---
# `create-bijou-tui-app`

Générez une nouvelle application TUI Bijou avec des valeurs par défaut tout compris.

## Rôle du package

- **Point de départ canonique** — les applications générées ciblent le chemin actuel `@flyingrobots/bijou-tui` + `@flyingrobots/bijou-tui-app` plutôt qu'un ancien chemin de démarrage de shell.
- **API publique uniquement** — l'application générée utilise les API publiques des packages afin de servir de canari en aval pour les mises à niveau en conditions réelles.
- **Valeurs par défaut alignées sur la version** — le projet généré reprend la même séparation shell/runtime que celle décrite dans les docs racine et le guide de migration.

## Utilisation

```sh
npm create bijou-tui-app@latest my-app
cd my-app
npm run dev
```

L'application générée peut aussi être exécutée directement avec :

```sh
npx tsx src/main.ts
```

## Ce qui est généré

- Point d'entrée d'application Node en TypeScript utilisant `createTuiAppSkeleton()`
- démarrage du runtime avec la souris activée (`run(..., { mouse: true })`)
- Dépendances :
  - `@flyingrobots/bijou`
  - `@flyingrobots/bijou-node`
  - `@flyingrobots/bijou-tui`
  - `@flyingrobots/bijou-tui-app`
- Scripts de départ : `dev`, `build`, `start`
- Un `tsconfig.json` strict
- Un README qui explique les modèles de shell que ce point de départ illustre
