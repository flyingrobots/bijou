---
title: "@flyingrobots/bijou-node"
summary: "Adaptadores de runtime, E/S, estilo, workers y grabación de Node para aplicaciones Bijou."
---

# @flyingrobots/bijou-node

Adaptadores de Node.js y utilidades de runtime para Bijou.

`@flyingrobots/bijou-node` conecta el núcleo puro y el runtime de TUI con el entorno de Node.js. Es responsable de la detección de plataforma, la E/S de terminal, el estilo basado en Chalk y las utilidades para hilos de worker.

## Rol

- **Implementación de puertos**: Asigna las API de Node.js a las interfaces de puertos de Bijou.
- **Runtime de workers**: Descarga la lógica TEA pesada en hilos de worker sin perder la capacidad de respuesta del hilo principal.
- **Arranque**: Inicio de aplicaciones alojadas con una sola llamada a `startApp()`.
