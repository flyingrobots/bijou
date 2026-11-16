# Biblioteca de componentes

[English](README.md) · [Français](README.fr.md) · Español · [Deutsch](README.de.md)

```sh
npm run components
```

La Biblioteca de componentes es un mazo de 58 diapositivas: un título, una diapositiva por cada una de las 14 secciones seguida de sus componentes, y una diapositiva final. Una sección agrupa familias de componentes relacionadas para explorarlas; los 42 componentes cubren 35 de las 36 familias de `docs/design-system/component-families.md`. Muestra un componente de Bijou a la vez en el centro de la pantalla, sin nada más que compita por la atención. Usa el mismo catálogo de 42 historias que DOGFOOD y Block Lab, y se ejecuta dentro del marco de aplicación estándar de Bijou, de modo que la búsqueda, los ajustes y la salida se comportan como en DOGFOOD.

La biblioteca se abre con una pantalla de título "Components Library", compuesta en DM Sans. Pulsa Enter para empezar.

| Tecla | Acción |
| --- | --- |
| `h` `l`, flechas izquierda y derecha | Diapositiva anterior o siguiente, de una en una; se detiene en la primera y la última |
| `PgUp` `PgDn` (o `[` `]`) | Diapositiva de sección anterior o siguiente; se detiene en el título y en la diapositiva final |
| `Tab`, `Shift-Tab` | Desliza el carrusel a la variante siguiente o anterior |
| `j` `k`, flechas arriba y abajo | Desplaza cuando el contenido es más alto que la pantalla |
| `1` `2` `3` `4` | Modo de salida: interactive, static, pipe, accessible |
| `i` | Activa o desactiva la información: la entrada de familia del sistema de diseño del componente y el ejemplo de la variante en pantalla (ver abajo) |
| `r` | Activa o desactiva el diseño de derecha a izquierda |
| `/` | Busca nombres de componentes; Enter muestra la coincidencia, Esc cierra |
| `F2` | Ajustes, incluido el tema del shell |
| `?` | Todos los atajos de teclado |
| `q`, `Esc` | Salir, tras una confirmación |

Una barra en la fila superior, en lugar del encabezado del marco, muestra cuánto has avanzado por todo el mazo y termina en una etiqueta como "3 of 58". La Biblioteca dibuja esta barra por sí misma: muestra una posición en una secuencia, no el progreso de una tarea, por lo que no usa `progressBar()`. Una ruta de navegación sobre el componente indica su sección y el componente. El `tabs()` de Bijou bajo el componente enumera sus variantes, y recurre a los puntos de `paginator()` cuando las pestañas son más anchas que la pantalla. La fila inferior muestra los modos de salida como pestañas, y luego los interruptores de información y de derecha a izquierda con su estado (`i info off · r RTL off`). El pie del marco muestra las teclas de navegación.

## Abrir en una pantalla concreta

Pasa opciones después de `--` para abrir la biblioteca en una diapositiva, un modo de salida y un tema concretos:

```sh
npm run components -- --component alert --variant warning --mode pipe --info
npm run components -- --component table --theme book --scheme light --rtl
npm run components -- --component toast --slide family
```

| Opción | Valores |
| --- | --- |
| `--component` | Un id de historia o nombre de función, como `alert` o `table` |
| `--variant` | Un id o etiqueta de variante, como `warning` |
| `--mode` | `interactive`, `static`, `pipe` o `accessible` |
| `--info` | Abrir con la información visible |
| `--rtl` | Abrir con el diseño de derecha a izquierda |
| `--slide` | `title`, `family` (la diapositiva de sección), `component` o `end` (por defecto: `component` si se indica `--component`, y `title` en caso contrario) |
| `--theme` | Una familia de temas del shell: `book` o `dogfood` |
| `--scheme` | `dark` o `light` |

Las opciones o valores desconocidos imprimen el problema y el uso, y terminan con el estado 2.

## Diapositivas de sección

La diapositiva de cada sección muestra el logotipo de Bijou, con su propia tipografía (Jacquard 12), sobre el nombre de la sección. Al avanzar hasta ella aparece la diapositiva. Enumera las funciones de la sección, una por línea, agrupadas bajo los nombres de familia del sistema de diseño, por ejemplo **Transient app notifications** o **Activity stream**. Todas las diapositivas de sección entran y salen con la misma transición de Bijou, una disolución de celdas.

Las diapositivas nunca avanzan solas. Pulsa Enter, Space, `l`, la flecha derecha o Tab para continuar al primer componente de la sección, o `h` o la flecha izquierda para volver. Las diapositivas de título y final también muestran el logotipo.

## Información y ejemplos

`i` muestra la entrada del componente en el vocabulario de la referencia de familias de componentes del sistema de diseño (registro R52 del libro). Comienza con el nombre de la familia y un resumen, y luego un cuadro titulado **Tip for this variant** con el consejo de la variante en pantalla. Debajo, **When to use each variant** enumera todas las variantes con su consejo; no cambia al cambiar de variante. Después vienen **Use when**, **Avoid when**, **Content guidance**, **Ownership**, **Graceful lowering** y **Related families**, y luego un **Example**. La historia del propio componente aporta un campo cuando lo tiene; su entrada de familia en `docs/design-system/component-families.md` aporta **Content guidance** y **Ownership**, y completa cualquier campo que falte en la historia. `guidedFlow()` aún no tiene entrada de familia, así que su panel muestra solo los campos de la historia.

El ejemplo es la llamada `render()` de la propia variante, leída de su archivo de historia en `examples/docs/`. Los ejemplos largos se abrevian y se indica así. Algunas historias llaman a un asistente de vista previa compartido, por lo que su ejemplo muestra ese asistente en lugar de una llamada directa al componente.

Los componentes que se animan se abren con su variante animada. El modo interactivo la reproduce; el modo estático muestra un solo fotograma congelado.

## Diseño de derecha a izquierda

`r` cambia la dirección de lectura. La biblioteca se la pasa al marco de aplicación mediante un runtime de i18n y refleja su propio cuerpo: el flujo de la ruta de navegación, la fila de modos, la dirección de deslizamiento del carrusel y la alineación del texto y de las diapositivas. Con el diseño de derecha a izquierda, `h`, `[` y la flecha izquierda avanzan hacia el final de la lista. El código, los nombres de funciones y los propios componentes no se reflejan.

El marco de aplicación refleja solo lo que admite hoy: el cajón de ajustes y las notificaciones se abren desde el otro lado. El encabezado, el pie y el chrome de los paneles aún no se reflejan; las issues #571 a #575 siguen el trabajo pendiente de derecha a izquierda.

## Grabar un recorrido

`npm run record:components` graba `components.webp`, un WebP animado a todo color (no se incluye en el repositorio; necesita `img2webp` de `brew install webp`): todas las diapositivas en el orden del mazo, del título a la diapositiva final, con una pulsación de `l` cada vez sobre un reloj simulado. Las diapositivas de título, de familia y final se mantienen más tiempo que las de componentes. `npm run record:components -- --out=path.webp` escribe en otro lugar (una ruta `.gif` escribe un GIF), y `-- --stills=1,45` también escribe imágenes fijas PNG en esos segundos.
