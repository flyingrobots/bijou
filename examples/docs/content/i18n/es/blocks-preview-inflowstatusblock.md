---
title: "  InFlowStatusBlock"
summary: "Muestra mensajes de estado duraderos dentro del flujo con hechos de gravedad, origen, acción y modos inferiores."
---
Muestra mensajes de estado duraderos dentro del flujo con hechos de gravedad, origen, acción y modos inferiores.
Familia: status
Escala: section
Modos: interactive, static, pipe, accessible
Ranuras: severity obligatorio, source opcional, message obligatorio, action opcional
Variantes: ready (Listo)
Requisitos de datos: status
Intenciones de comando: inFlowStatus.select, inFlowStatus.copyFacts, inFlowStatus.openStory
Historias: in-flow-status.ready (ready)
