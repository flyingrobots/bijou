---
title: "@flyingrobots/bijou"
summary: "El núcleo puro del toolkit: prompts, Componentes, temas, puertos y primitivas de Surface."
---

# @flyingrobots/bijou

El núcleo puro y sin dependencias de Bijou.

`@flyingrobots/bijou` proporciona las primitivas fundamentales para CLIs, prompts y salida de terminal portable. Gestiona Componentes, temas, detección del entorno y los tipos centrales `Surface` y `LayoutNode`.

## Función

- **Degradación primero**: detección automática del modo de salida `interactive`, `static`, `pipe` y `accessible`.
- **Modo mixto**: primitivas `Surface` de alto rendimiento para apps TUI ricas, con
  helpers basados en cadenas para scripts CLI independientes.
- **Primitivas de Surface sin abandonar las cadenas**: las apps en tiempo de ejecución pueden seguir en
  la ruta de Surface mientras los flujos centrados en CLI siguen usando los helpers basados en cadenas.
- **Núcleo hexagonal**: lógica TypeScript pura aislada del IO de la plataforma mediante los puertos `Runtime`, `IO` y `Style`.
