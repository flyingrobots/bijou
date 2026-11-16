---
title: "Mapa de ejemplos secundarios"
summary: "Por qué los ejemplos son ahora secundarios o internos y qué valor de referencia conservan."
---

# Mapa de ejemplos secundarios

Este archivo ya no es un enorme registro de estado por ejemplo.

Es un mapa de referencia para mantenedores y agentes, no un centro
público de documentación.

DOGFOOD es la principal superficie de documentación viva y de prueba. En v4.4.0
se retiraron 31 ejemplos porque DOGFOOD ya cubre directamente sus familias
de componentes. Los ejemplos restantes existen como referencias de costuras del runtime,
pruebas del shell y demostraciones de API hoja que DOGFOOD todavía
no enseña.

Si quieres aprender Bijou, empieza por [DOGFOOD](./DOGFOOD.md),
no por este archivo.

Para el inventario secundario/interno completo, usa
[../examples/README.md](../examples/README.md).

## Conservar

Estos ejemplos siguen teniendo un claro valor secundario o de referencia.

### Referencias de runtime

Conserva estos como el conjunto principal de referencia del runtime para la línea `v4.0.0`:

- `examples/v3-demo`
- `examples/v3-css`
- `examples/v3-motion`
- `examples/v3-subapp`
- `examples/v3-worker`
- `examples/v3-pipeline`

Mantienen los nombres históricos `v3-*`, pero siguen siendo las referencias más claras de las costuras del runtime en esta rama.

### DOGFOOD y superficies de prueba del shell

Consérvalos porque prueban comportamiento a nivel de producto en lugar de renderizado aislado de hojas:

- `examples/docs`
  - la aplicación de documentación viva y la superficie de prueba actual
- `examples/release-workbench`
  - shell canónico de sala de control con varias vistas
- `examples/notifications`
  - pila de notificaciones, enrutamiento, historial y comportamiento de revisión del shell
- `examples/app-frame`
  - referencia de shell con marco

### Ejemplos hoja restantes

Conserva los ejemplos hoja cuando sean la explicación aislada más clara de
una familia o costura de API que las historias de DOGFOOD aún no cubren. El conjunto
restante de este archivo es la referencia actual para las retiradas de ejemplos que
todavía dependen de una enseñanza más profunda en DOGFOOD. La continuación histórica sobre profundidad
es [DF-020](./method/retro/DF-020-deepen-dogfood-story-depth-and-variant-quality.md).

## Recortar más adelante

Un ejemplo solo pasa a ser candidato a retirada cuando se cumplen todas las condiciones siguientes:

1. DOGFOOD u otro escenario canónico enseña ya con claridad la misma decisión.
2. Ninguna guía de migración ni README de paquete apunta todavía al ejemplo.
3. No aporta un valor único de smoke o de regresión.
4. No es la prueba aislada más clara de una costura de API pública.

## Relación con el smoke de publicación

El smoke de publicación se ejecuta ahora mediante `smoke:dogfood`.

Cierre registrado:

- [WF-003 — Sustituir `smoke:examples:*` por `smoke:dogfood`](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

Eso significa que los ejemplos ya no son el contrato de smoke de cara a la publicación, aunque
todavía exista algo de herramienta interna de referencia en torno a los escenarios de ejemplo.
