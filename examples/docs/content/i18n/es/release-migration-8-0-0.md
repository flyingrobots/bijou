---
title: "Guía de migración v8.0.0"
summary: "Guía de migración para la actualización a 8.0.0."
---

# Migrar a Bijou 8.0.0-rc.1

Esta es una versión candidata. Fija la versión exacta; no uses un rango con caret.

```bash
npm install @flyingrobots/bijou@8.0.0-rc.1 \
            @flyingrobots/bijou-node@8.0.0-rc.1 \
            @flyingrobots/bijou-tui@8.0.0-rc.1
```

Todos los paquetes del workspace se versionan a la vez, así que mezclar `8.0.0-rc.1` con
paquetes `7.2.0` no está soportado.

Dos cambios incompatibles, ambos de
[`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md). Ninguno requiere
cambios de código en la mayoría de aplicaciones; ambos cambian lo que tu aplicación *hace* en
situaciones que quizá no hayas probado.

## 1. `NO_COLOR` ya no fuerza el modo `'pipe'`

### Qué cambió

`detectOutputMode()` ya no inspecciona `NO_COLOR`. El orden de detección es ahora:

```text
BIJOU_ACCESSIBLE=1  -> 'accessible'
TERM=dumb           -> 'pipe'
!stdout.isTTY       -> 'pipe'
CI                  -> 'static'
stdout.isTTY        -> 'interactive'
```

### Por qué

`NO_COLOR` es una declaración sobre el color. [no-color.org](https://no-color.org)
especifica que su presencia "impide añadir color ANSI" y no dice
nada sobre el direccionamiento del cursor ni la interactividad. Asignarlo a `'pipe'` hacía que un
usuario que exportaba `NO_COLOR=1` en el perfil de su shell —algo común y razonable— perdiera
toda la TUI en lugar de solo su color: cada Componente se reducía a su
forma de un solo fotograma, y `shouldUseShellQuitConfirm()` empezaba a devolver
`'immediate'`.

### Qué *no* cambió

La salida de color. `NO_COLOR` lo leen de forma independiente `createBijou()`,
`createNodeContext()` e `isNoColor()`, y ninguno consulta el modo. Con
`NO_COLOR` definido sigues obteniendo `theme.noColor === true`, `ink()` devolviendo
`undefined` y `styled()` devolviendo texto sin estilo.

Para precisar el alcance: una sesión interactiva sí emite movimientos del cursor,
actualizaciones de pantalla y posiblemente secuencias de pantalla alternativa; tiene que hacerlo o no
sería una TUI. Lo que `NO_COLOR` suprime son **los escapes de color y estilo**, que es lo que
pide.

### Qué puede que tengas que hacer

**Si dependías de `NO_COLOR` para obtener salida de un solo fotograma**, por ejemplo en un script o en un
arnés que captura logs, ya no lo hace. Usa la opción que sea precisa:

```ts
// The terminal genuinely cannot do cursor addressing:
TERM=dumb

// You are capturing output rather than driving a terminal:
//   redirect stdout — a non-TTY stdout still yields 'pipe'

// You want to force it from inside the app:
const ctx = { ...createBijou(ports), mode: 'pipe' as const };
```

**Si definías `NO_COLOR` porque querías una TUI monocroma**, ahora la obtienes.
No hace falta hacer nada; esta es la corrección.

**Si escribiste tu propio detector para sortear esto** —`git-cas` y `muniment`
lo hicieron—, puedes eliminarlo. Comprueba que tu sobrescritura no codifique también
otra cosa que sigas queriendo.

## 2. Una clave de estado desconocida ya no se resuelve a un token tachado

### Qué cambió en la alternativa

`ctx.status(key)` y `ResolvedTheme.inkStatus(key)` recurren a
`semantic.muted` en lugar de `status.muted` cuando `key` no está en el tema.

### Por qué se movió la alternativa

`status.muted` lleva `['dim', 'strikethrough']` en todos los presets incluidos. Eso
es razonable para un token que significa "retirado", y erróneo como respuesta a "no
conozco esta clave". Como `status(key)` acepta `string`, una errata o una clave que una
aplicación olvidó añadir a su tema renderizaba en silencio texto con una línea
encima. Un lector ve "cancelado"; la aplicación no dijo nada parecido.

El nuevo destino coincide con el accesor hermano `ui()`, que ya recurre a
`semantic.primary`.

### Qué puede que tengas que hacer respecto a la alternativa

**Probablemente nada.** `status.muted` y `semantic.muted` comparten hex en todos los
presets incluidos, así que la única diferencia visible es la ausencia del
tachado.

**Si definiste un tema en el que esos dos tokens tienen hex distintos**, una
clave desconocida ahora se resuelve al hex de `semantic.muted`. Revisa cualquier preset personalizado.

**Si dependías de la alternativa tachada** como forma de detectar claves sin definir
durante el desarrollo, ya no existe. Nunca fue una señal fiable: solo
aparecía cuando una ruta de código se ejecutaba realmente.
[#521](https://github.com/flyingrobots/bijou/issues/521) sigue el tipado de los
accesores para que una clave ausente se convierta en un error de compilación.

`ctx.status('muted')` en sí no cambia; el tachado sigue intacto.

## 3. Aditivo: `extendTheme()` alcanza los seis grupos de tokens

No es incompatible. `border` y `semantic` se suman a `status`, `ui`, `gradient` y
`surface`:

```ts
const theme = extendTheme(BIJOU_DARK, {
  status: { guarded: tv('#4cc9c3') },
  border: { primary: tv('#75798d') },     // now possible
  semantic: { accent: tv('#d6c5ff') },    // now possible
});
```

Ambos se pueden sobrescribir pero no ampliar con claves nuevas, porque `Theme` fija
sus conjuntos de claves.

### Por qué esto importa más de lo que parece

Los presets incluidos reutilizan mucho los colores entre grupos. `bijou-dark` usa `#f2c45d` para
`status.warning`, `status.active`, `semantic.warning`, `semantic.accent`,
`ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`, `border.secondary`
**y** `border.warning`: diez tokens, un color. `bijou-light` hace lo mismo
con `#7a5200`.

Así que `extendTheme(BIJOU_DARK, { status })` reemplazaba tus estados y conservaba en silencio
ese ámbar para cada encabezado, cursor y borde. Si lo has hecho, probablemente tus
encabezados tengan el mismo color que tu `warning`. No es hipotético:
así es como se descubrió, con un ΔE de 0.023 en OKLab, que es indistinguible.

Si sobrescribes `status`, plantéate auditar también `ui` y `border`:

```ts
import { doctorTheme } from '@flyingrobots/bijou';
console.log(doctorTheme(myTheme, { maxColorReuse: 2 }));
```

Ten en cuenta que `doctorTheme` comprueba el contraste y la reutilización, pero no la separación perceptual
en deficiencias de visión del color —consulta
[#520](https://github.com/flyingrobots/bijou/issues/520)— y que los presets
incluidos no la cumplen actualmente
([#519](https://github.com/flyingrobots/bijou/issues/519)).

## Enviar comentarios sobre la rc

Esta candidata existe para averiguar qué rompen estos dos cambios en aplicaciones
reales. Abre tus comentarios en
[#518](https://github.com/flyingrobots/bijou/issues/518) o abre un issue nuevo con
la etiqueta `lane:release`.
