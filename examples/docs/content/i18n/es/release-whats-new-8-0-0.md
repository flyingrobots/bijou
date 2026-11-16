---
title: "Novedades de v8.0.0"
summary: "La historia detallada de la versión para la línea 8.0.0."
---

# Novedades de Bijou 8.0.0-rc.1

Una versión candidata, publicada para que los cambios incompatibles que se describen a continuación puedan validarse
con aplicaciones reales antes de publicar `8.0.0`. Fija la versión exacta; el
dist-tag es `next`, no `latest`.

## Lo más destacado es una eliminación

`detectOutputMode()` ya no consulta `NO_COLOR`.

Esa variable significa una sola cosa: no me envíes color. Nunca ha significado «no
dibujes una interfaz de usuario». Bijou la interpretaba como una señal de capacidad, así que un desarrollador que
tenía `NO_COLOR=1` en el perfil de su shell no obtenía una TUI monocroma: no obtenía
ninguna TUI. Todos los componentes pasaban a su forma de un solo fotograma, y la confirmación de salida
dejaba de preguntar.

La pista fue que dos consumidores propios habían escrito, cada uno por su cuenta, su
propio detector para esquivarlo. `git-cas` incluye un `detectCliTuiMode` con un
comentario que explica el problema; `muniment` escribió la misma anulación por el mismo
motivo. Cuando los consumidores reimplementan tu detector, el detector está respondiendo a una
pregunta que nadie le hizo.

El color no se ve afectado: nunca estuvo acoplado al modo en la implementación,
solo en el detector. `NO_COLOR` se lee de forma independiente en tres lugares, ninguno de
los cuales consulta `ctx.mode`, así que con la variable definida sigues obteniendo `theme.noColor === true`
y una salida sin estilos. Lo que ahora obtienes además es una TUI que funciona.

La prueba de esto tiene una forma que merece la pena copiar. En lugar de afirmar qué modo
produce `NO_COLOR`, la propiedad afirma que añadir `NO_COLOR` a *cualquier*
entorno deja sin cambios el modo de ese entorno: el contrato enunciado
directamente, sobre 200 combinaciones generadas de valor, estado de TTY, `CI` y `TERM`.

## Una clave de estado desconocida ya no parece cancelada

`ctx.status('typo')` recurría antes a `status.muted`, y `status.muted`
lleva `strikethrough` en todos los presets incluidos. Así, una clave mal escrita, o una clave que una
aplicación pretendía definir y no definió, mostraba el texto tachado. El
lector ve «cancelado». La aplicación nunca dijo eso.

Ahora recurre a `semantic.muted`, que es atenuado y nada más, igual que
lo que ya hacía el accesor hermano `ui()` con `semantic.primary`.

Este caso surgió de una aplicación real que publicó el error: se declaró un painter,
su clave de estado se eliminó después del tema por estar duplicada, y el painter
siguió resolviéndose con el valor de respaldo. Nada lo detectó (ni el comprobador de tipos, ni una
auditoría de la paleta, ni la revisión) porque ninguna vista lo había invocado todavía.
[#521](https://github.com/flyingrobots/bijou/issues/521) hace el seguimiento del tipado de los
accesores para que eso se convierta en un error de compilación.

## `extendTheme()` por fin llega a todos los grupos

`Theme` tiene seis grupos de tokens. `extendTheme()` aceptaba extensiones para cuatro, lo que
parece un descuido y se comporta como una trampa, porque los presets incluidos
reutilizan un mismo color entre los grupos a los que no podías llegar.

`bijou-dark` pinta `status.warning`, `status.active`, `semantic.warning`,
`semantic.accent`, `ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`,
`border.secondary` y `border.warning` con un único ámbar. Diez tokens. Así que
`extendTheme(BIJOU_DARK, { status })` te daba tus estados y dejaba ese ámbar
en todos los encabezados, cursores y bordes; y si uno de tus nuevos estados también
tiraba a ámbar, tus encabezados pasaban a ser indistinguibles de tus advertencias. Así
es como se descubrió, con un ΔE de 0.023 en OKLab.

`border` y `semantic` ya son accesibles. Se pueden sobrescribir pero no
ampliar, ya que `Theme` fija sus conjuntos de claves.

El alias en sí sigue ahí. `extendTheme()` permite escapar de él, no lo corrige;
consulta [#519](https://github.com/flyingrobots/bijou/issues/519), que también registra
que `error` y `success` se reducen a un ΔE de 0.059 con protanopía en el preset
oscuro y de 0.064 en el claro, y que la escala de gravedad de `bijou-light` está
invertida en luminosidad. Si dependes de los presets incluidos para distinguir
gravedades, lee ese issue.

## También en esta candidata

Todo lo que se ha acumulado en `main` desde `7.2.0`:

- **Inspección de Profunctor Page en terminal**: `lowerProfunctorPageArtifacts()`
  valida la familia canónica `profunctor-page/0` y emite IR de escena determinista,
  superficies, mapas de destinos, recibos, mapas de origen de celdas y evidencias de texto
  en seis modos de inspección, con la semántica de navegador no admitida conservada como
  residuos de capacidad explícitos.
- **Prueba del paquete de artefactos VISOR**: `createVisorArtifactBundleFromGraphql()`,
  `createVisorArtifactBundle()` y los tipos `visor-artifact-bundle/1`.
- **Recibos de celdas empaquetadas RE-036**: `adaptPackedBijouCellsToSurface()` copia
  bytes validados y entradas de tablas auxiliares sin volver a codificar las celdas.
- **Cierre de seguridad de dependencias**: mínimos parcheados en todo el grafo resuelto,
  con una prueba de regresión que los fija y un `npm ci` limpio que reproduce una
  auditoría sin vulnerabilidades.
- **Avance del ratchet de Code Dojo**: tramos A a E, además de los requisitos previos de
  DX-050, la deuda de localización de DOGFOOD y el trabajo de contratos de documentación.

## Para qué sirve esta candidata

Dos cambios de comportamiento que son correctos en principio y no están probados en la práctica.
Si `NO_COLOR` o un tema personalizado importan en tu aplicación, esta es la versión
que debes probar antes de que exista `8.0.0`.

Lee la [guía de migración](./migration-guide.md) para conocer los puntos concretos que comprobar,
y el [paquete de evidencias de la versión](./README.md), que indica explícitamente qué
evidencias se reprodujeron para esta candidata y cuáles se heredaron, porque nueve de
las once puertas de revisión de la normativa de publicación siguen sin revisar. Precisamente por eso esta es
una rc y no una versión definitiva.
