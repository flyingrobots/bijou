---
title: "@flyingrobots/bijou-tui-app"
summary: "La plantilla de shell enmarcado y con opiniones propias para apps de Bijou a pantalla completa con pestañas."
---

# `@flyingrobots/bijou-tui-app`

Esqueleto de app TUI completo construido sobre `createFramedApp()`.

## Función del paquete

- **Contrato de shell puro** — los paneles enmarcados ahora permanecen en la ruta de Surface/layout. Los paneles del shell renderizan `Surface` o `LayoutNode`, no vistas de cadena.
- **Función de shell fiel** — este paquete es la capa de shell con opiniones propias de la pila de Bijou, no todo el runtime. Úsalo cuando quieras pestañas, cromo de pie/ayuda, superposiciones y un marco de app listo para ejecutarse.
- **Plantilla canónica de la versión** — el generador y las referencias actuales del runtime tratan este paquete como la forma predeterminada de montar una app de Bijou pulida a pantalla completa.

Incluye un shell listo para ejecutarse con valores predeterminados sensatos:
- shell de app enmarcado a pantalla completa
- barra de pestañas superior (separadores `|`, fondos de pestaña activa/inactiva)
- cajón complementario animado en la primera pestaña (`o` lo alterna)
- cambio de página con `[` y `]`
- modal de confirmación de salida con `q` y `ctrl+c`
- pie de dos líneas: línea de estado sobre la línea de controles
- fila separadora `\` a todo el ancho sobre el pie
- dos pestañas predeterminadas:
  - pestaña 1: panel principal + cajón complementario
  - pestaña 2: división horizontal para flujos de comparación/inspección

## Cuándo usarlo

Usa `@flyingrobots/bijou-tui-app` cuando:
- tu app tiene destinos de igual nivel que pertenecen a pestañas
- quieres cromo de shell, ayuda, estado y descubrimiento de comandos estandarizados
- el trabajo secundario debe vivir en un cajón en lugar de ocupar toda la pantalla
- la salida destructiva o los flujos de revisión deben gestionarse con un modal

Evítalo cuando:
- estás construyendo una CLI de una sola ejecución o un flujo de prompts
- la UI es básicamente un documento y no necesita cromo de shell
- quieres un shell totalmente personalizado en lugar de adoptar la plantilla con opiniones propias de Bijou

## Función en el sistema de diseño

La plantilla tiene opiniones propias de forma intencionada:
- las pestañas son para destinos de igual nivel
- el cajón es para trabajo lateral complementario, filtros, inspección y contexto
- el modal de salida es para confirmaciones bloqueantes
- las filas del pie son cromo del shell, no contenido de la página
- la página dividida muestra un layout de comparación y contexto secundario, no relleno genérico
