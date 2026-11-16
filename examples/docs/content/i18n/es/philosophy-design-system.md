---
title: "Visión general del sistema de diseño"
summary: "Los fundamentos, patrones, Blocks y la doctrina de familias de Componentes detrás de la UI de Bijou."
---

# Sistema de diseño de Bijou

Bijou ya tiene suficiente superficie como para que "aquí están los exports" deje de ser una buena estrategia de documentación.

Esta sección define el lenguaje de diseño que hay detrás de la biblioteca:

- los fundamentos que dan forma a la UI
- el vocabulario de tokens que convierte la doctrina de color en reglas de API
- los patrones de interacción y layout que se repiten entre apps
- las familias de Componentes y sus funciones previstas
- la política para visualizar datos en lugar de improvisar cada vez

Esto está deliberadamente más cerca de una guía de sistema de diseño que de una referencia de API.

## Para qué sirve esta sección

Usa esta documentación cuando necesites responder:

- ¿Qué problema resuelve esta familia de Componentes?
- ¿Qué variante debo usar?
- ¿Qué familia de tokens debe usar este Componente?
- ¿Cuándo debo elegir un Componente en lugar de otro?
- ¿Cuándo debo evitar este Componente por completo?
- ¿Pertenece esto al núcleo `@flyingrobots/bijou` o a `@flyingrobots/bijou-tui`?
- ¿Cómo debe degradarse en ejecuciones `interactive`, `static`, `pipe` y `accessible`?
- ¿Cuál es el equivalente pensado primero para la terminal de un patrón de sistema de diseño de escritorio/web?

## Léela en este orden

1. [Fundamentos](./foundations.md)
2. [Vocabulario de tokens de tema](./theme-tokens.md)
3. [Guía de autoría de temas](./theme-authoring.md)
4. [Recetas de reglas de tema](./theme-rule-recipes.md)
5. [Patrones](./patterns.md)
6. [Blocks](./blocks.md)
7. [Política de puntero y ratón](./pointer.md)
8. [Familias de Componentes](./component-families.md)
9. [Política de visualización de datos](./data-visualization.md)

Para el inventario en bruto y el trabajo de taxonomía detrás de esta documentación, consulta [../archive/component-system-audit.md](../archive/component-system-audit.md).

## Ideas centrales del sistema

### Bijou no es solo una biblioteca de Componentes

Bijou se compone de cinco capas:

1. **Fundamentos**
  - color, ritmo de espaciado, jerarquía de texto, desbordamiento, movimiento, foco, interrupción
2. **Vocabulario de tema**
  - familias de tokens canónicas y reglas de uso propias
3. **Patrones**
  - estado, selección, navegación, superposiciones, formularios, composición del shell
4. **Familias de Componentes**
  - primitivas específicas que implementan esos patrones
5. **Blocks**
  - ensamblajes reutilizables a nivel de producto, como marcos de app, flujos de ajustes y flujos de trabajo guiados

Los Componentes y los Blocks deben depender de las tres primeras capas. Si el
lenguaje de diseño es débil, tanto el catálogo de Componentes como la biblioteca de Blocks se vuelven
ruidosos sin importar cuántos exports existan.

### Propiedad del núcleo frente a TUI

- `@flyingrobots/bijou` es dueño de la semántica que sobrevive a la degradación.
- `@flyingrobots/bijou-tui` es dueño del foco, el movimiento, las superposiciones, el comportamiento del shell, el desplazamiento, el historial y otras interacciones con mucho ciclo de vida.

Eso significa que:

- `alert()` pertenece al núcleo.
- `toast()` pertenece a TUI.
- las notificaciones pertenecen a TUI porque son un sistema, no solo un renderizado.

### No todas las variantes son iguales

Bijou usa tres tipos de variante:

- **variantes semánticas**
  - por ejemplo, el tono o la gravedad del estado
- **variantes de capa de interacción**
  - por ejemplo, `accordion()` frente a `interactiveAccordion()`
- **variantes de ruta de renderizado**
  - por ejemplo, `box()` frente a `boxSurface()`

Solo el primer tipo es una "variante visual" en el sentido habitual de un sistema de diseño. Los otros dos existen porque Bijou tiene que sobrevivir a distintas capas de interacción y renderizado.

### La reducción elegante es una restricción de diseño de primer orden

Cada familia debe responder:

- ¿Cómo se ve esto en una terminal interactiva rica?
- ¿Qué sigue siendo cierto en la salida estática de CI?
- ¿Qué sigue siendo cierto en el modo `pipe`?
- ¿Qué se simplifica en el modo `accessible`?

Si un Componente no puede responder a esa pregunta, probablemente pertenece a `@flyingrobots/bijou-tui`, no al núcleo.

## Estándar de documentación

Toda página madura de familia de Componentes en Bijou debe incluir:

- Qué es
- Variantes
- Cuándo usarla
- Cuándo no usarla
- Guía de contenido
- Propiedad de la interacción
- Ruta de reducción elegante
- Familias relacionadas

La guía de familias de Componentes ya cumple esta base estructural y su estructura se comprueba con un script de preflight del repositorio. Ese preflight es intencionadamente estructural: verifica las secciones obligatorias de cada familia y la cobertura de modos de reducción elegante dentro de la guía de familias. La precisión semántica, la deriva de la documentación de paquetes/ejemplos y la completitud de la documentación de los Componentes tocados siguen siendo responsabilidades de la revisión, no algo que el script actual pueda demostrar automáticamente.

## Puerta de cambios de Componentes

A partir de la limpieza pure-surface de v4, cualquier cambio en una familia de Componentes debe evaluarse frente a la documentación en el mismo bloque de trabajo.

Para cada Componente o familia de Componentes tocado, verifica que:

- la documentación existe
- las variantes documentadas están al día
- la guía `When to use` está presente y sigue siendo precisa
- la guía `When not to use` está presente y sigue siendo precisa
- la propiedad núcleo frente a TUI es explícita
- la reducción elegante está documentada en `rich`, `static`, `pipe` y `accessible` cuando corresponda
- las familias relacionadas están listadas

El preflight de CI impone el mínimo estructural para la guía de familias. Si falta alguna de las comprobaciones más amplias de abajo o es materialmente incorrecta, la documentación sigue incompleta y esa carencia debe corregirse en el mismo bloque de trabajo o registrarse explícitamente como deuda pendiente antes de dar el trabajo por terminado.

## Carencias actuales que esta sección debe cerrar

Bijou ya es fuerte en amplitud y en arquitectura de runtime. Las partes más débiles son:

- guía de uso explícita
- documentación a nivel de familia
- completitud de la documentación frente al estándar definido arriba
- apoyo a la decisión a nivel de patrón
- doctrina de visualización de datos
- política de ratón y entrada múltiple

Esta documentación existe para corregir eso.
