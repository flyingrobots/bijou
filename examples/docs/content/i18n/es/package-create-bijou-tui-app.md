---
title: "create-bijou-tui-app"
summary: "El generador para arrancar un proyecto de app TUI de Bijou listo para ejecutarse."
---

# `create-bijou-tui-app`

Genera una nueva app TUI de Bijou con valores predeterminados completos.

## Función del paquete

- **Plantilla canónica** — las apps generadas apuntan a la ruta actual `@flyingrobots/bijou-tui` + `@flyingrobots/bijou-tui-app` en lugar de una ruta antigua de plantilla de shell.
- **Solo API pública** — la app generada usa las API públicas de los paquetes para que pueda servir como canario downstream de actualizaciones reales.
- **Valores predeterminados alineados con la versión** — el proyecto generado sigue la misma división shell/runtime descrita en la documentación raíz y en la guía de migración.

## Uso

```sh
npm create bijou-tui-app@latest my-app
cd my-app
npm run dev
```

La app generada también se puede ejecutar directamente con:

```sh
npx tsx src/main.ts
```

## Qué genera

- Punto de entrada de app Node en TypeScript que usa `createTuiAppSkeleton()`
- arranque del runtime con ratón habilitado (`run(..., { mouse: true })`)
- Dependencias:
  - `@flyingrobots/bijou`
  - `@flyingrobots/bijou-node`
  - `@flyingrobots/bijou-tui`
  - `@flyingrobots/bijou-tui-app`
- Scripts iniciales: `dev`, `build`, `start`
- `tsconfig.json` estricto
- Un README que explica los patrones de shell que modela la plantilla
