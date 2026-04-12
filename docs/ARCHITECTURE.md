# ARCHITECTURE

This is the short architecture signpost for the docs surface.

Bijou is a nine-package monorepo for terminal software in TypeScript. The root
[ARCHITECTURE.md](../ARCHITECTURE.md) is the main entrypoint, but DOGFOOD and
the docs lane still need a repo-owned summary here.

## Structure

- `@flyingrobots/bijou` owns the pure core: prompts, themes, components, and
  surfaces
- `@flyingrobots/bijou-tui` owns the fullscreen runtime, layout, motion,
  overlays, and framed shell
- `@flyingrobots/bijou-node` owns the terminal/process boundary, worker
  runtime, and recorder
- the i18n packages own runtime catalogs plus localization authoring/exchange
  workflows

## Read Next

- [root architecture signpost](../ARCHITECTURE.md)
- [runtime architecture](../packages/bijou-tui/ARCHITECTURE.md)
- [node architecture](../packages/bijou-node/ARCHITECTURE.md)
- [core architecture](../packages/bijou/ARCHITECTURE.md)
