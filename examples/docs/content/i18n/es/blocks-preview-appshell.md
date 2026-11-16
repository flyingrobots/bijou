---
title: "  AppShell"
summary: "Compone regiones lógicas de la app para navegación, contenido, inspección, estado y superposiciones."
---

Compone regiones lógicas de la app para navegación, contenido, inspección, estado y superposiciones.
Familia: app-structure
Escala: app
Modos: interactive, static, pipe, accessible
Slots: navigation opcional, content obligatorio, inspector opcional, status opcional, overlays opcional
Variantes: wide (Ancho), narrow (Estrecho)
Requisitos de datos: -
Intenciones de comando: shell.focusRegion, shell.toggleInspector, shell.openOverlay
Historias: app-shell.ready (ready), app-shell.narrow (narrow), app-shell.overlay (overlay)
