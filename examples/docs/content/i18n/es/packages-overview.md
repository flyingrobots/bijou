---
title: "Visión general de los paquetes"
summary: "Cómo encajan los paquetes públicos del espacio de trabajo en la pila de Bijou."
---

# Paquetes

Esta sección es la guía de paquetes del espacio de trabajo publicado de Bijou.

## Mapa actual de paquetes

- `@flyingrobots/bijou` — superficies del núcleo, tokens, utilidades de layout y componentes
- `@flyingrobots/bijou-node` — adaptadores de Node para el runtime y el estilo
- `@flyingrobots/bijou-tui` — shell con marco y runtime de aplicaciones de terminal
- `@flyingrobots/bijou-tui-app` — utilidades de aplicación y andamiaje del shell
- `create-bijou-tui-app` — plantilla de proyecto y flujo de inicio
- `@flyingrobots/bijou-i18n*` — runtime, herramientas y adaptadores de localización
- `@flyingrobots/bijou-mcp` — renderizado de componentes y datos semánticos para clientes MCP

## Cómo usar esta sección

- usa el panel izquierdo para abrir el paquete que te interese
- usa el panel central para leer el rol del paquete y la guía de su superficie
- usa el panel derecho para ver un breve resumen de para qué sirve esa página

Las páginas de paquetes de esta sección se publican a partir de la documentación real
del espacio de trabajo del repositorio, para que DOGFOOD funcione como una verdadera guía de paquetes
en lugar de ser solo una página de inicio provisional.

El paquete TUI es responsable de la API inmutable de fuentes ráster. La decodificación de fuentes, las descargas
de Google Fonts y los controles tipográficos por elemento viven en el ejemplo de Markdown;
no son funciones automáticas de carga de TTF del renderizador puro. Consulta
**Guides → Latest Features** y `examples/markdown-font/README.md`.
