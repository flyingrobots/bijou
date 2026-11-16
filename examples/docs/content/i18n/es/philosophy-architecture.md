---
title: "Arquitectura"
summary: "La referencia estructural del espacio de trabajo de nueve paquetes y sus líneas de core, runtime e i18n."
---

# ARQUITECTURA

Esta es la breve señal de arquitectura de la superficie de documentación.

Bijou es un monorepo de nueve paquetes para software de terminal en TypeScript. El
[ARCHITECTURE.md](../ARCHITECTURE.md) raíz es el punto de entrada principal, pero DOGFOOD y
la línea de documentación siguen necesitando aquí un resumen propio del repositorio.

## Estructura

- `@flyingrobots/bijou` es responsable del núcleo puro: prompts, temas, componentes y
  superficies
- `@flyingrobots/bijou-tui` es responsable del runtime de pantalla completa, el layout, el movimiento,
  las superposiciones y el shell con marco
- `@flyingrobots/bijou-node` es responsable del límite con el terminal y el proceso, el runtime
  de workers y el grabador
- los paquetes de i18n son responsables de los catálogos en tiempo de ejecución y de los flujos
  de autoría e intercambio de localización

## Lecturas siguientes

- [señal de arquitectura raíz](../ARCHITECTURE.md)
- [arquitectura del runtime](../packages/bijou-tui/ARCHITECTURE.md)
- [arquitectura de node](../packages/bijou-node/ARCHITECTURE.md)
- [arquitectura del núcleo](../packages/bijou/ARCHITECTURE.md)
