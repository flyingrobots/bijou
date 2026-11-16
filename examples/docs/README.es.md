# Notas de la aplicación DOGFOOD

[English](README.md) · [Français](README.fr.md) · Español · [Deutsch](README.de.md)

Si quieres aprender Bijou, empieza por
[../../docs/DOGFOOD.md](../../docs/book/bijou-designs.pdf#page=292). Este archivo es la
nota orientada a la implementación de la superficie actual de la aplicación DOGFOOD.

Primer corte de DOGFOOD: una superficie de documentación guiada por historias, creada con el propio Bijou.

## Ejecutar

```sh
npm run dogfood
```

Para el banco de trabajo independiente BlockLab, de desarrollo y pruebas, ejecuta:

```sh
npm run blocklab
```

Para un índice de BlockLab en texto y una matriz de capturas sobre el mismo catálogo de historias de DOGFOOD, ejecuta:

```sh
npm run blocklab:index
```

Ahora aterrizas primero en una pantalla de título dedicada a pantalla completa: la aplicación dibuja una
estela procedural de ondas sinusoidales apiladas mediante el shader del fondo de aterrizaje, escribiendo
los colores de la estela en los fondos de las celdas mientras los glifos de densidad usan colores de
primer plano a juego. Después usa [assets/Bijou.svg](../../assets/Bijou.svg) como
máscara de glifos con fondo transparente en colores complementarios. La pantalla de aterrizaje
mantiene un tratamiento sobrio:
el arte del título V7, una indicación `Press [Enter]` centrada, el
logotipo de [assets/flyingrobotslogo.txt](../../assets/flyingrobotslogo.txt) y una
última línea reservada al pie con la guía para salir o continuar y la versión de Bijou. La
marca de Bijou conserva el fondo de celda existente y deriva el primer plano complementario
de la estela visible. El logotipo Braille de FlyingRobots mantiene transparentes las celdas vacías del recurso,
conserva el fondo de celda subyacente para los glifos visibles y pinta esos glifos con el color opuesto al de
ese fondo conservado.

Solo en la pantalla de aterrizaje, `1-5` cambian entre los ajustes preestablecidos de paleta y `←` / `→` recorren los temas. La tecla de acento grave activa o desactiva en su lugar el HUD de rendimiento compartido del shell, `Esc` o `q` salen de inmediato allí, y cualquier otra tecla sin modificadores entra en el shell de documentación.

El ratón está activado en esta vista previa. En el shell de documentación, haz clic en un panel para
darle el foco y usa la rueda para desplazar documentos largos o el contenido de la ayuda.

## Qué demuestra

- `ComponentStory` v0 puede contener campos didácticos estructurados en lugar de un único blob de Markdown
- una página de aterrizaje y un shell de documentación pueden funcionar con el mismo sustrato de historias
- el mismo sustrato de historias también puede producir un banco de trabajo BlockLab independiente y una matriz de capturas determinista
- el shell de documentación puede contener tanto guías en prosa como el explorador de componentes
- el panel de documentación y el panel de vista previa derivan del mismo registro de historia una vez que entras en la sección `Components`
- el cambio de perfil es parte de la experiencia, no una ocurrencia tardía
- un shell enmarcado puede presentar tanto secciones de documentación de nivel superior como un explorador de componentes completo sin fingir que son lo mismo
- el shell de documentación ahora elige variantes de diseño explícitas `wide`, `standard`, `narrow` y `tiny`, de modo que el redimensionado de la terminal sigue siendo una decisión de producto y no solo un recálculo geométrico
- DOGFOOD ahora también puede publicar la orientación del repositorio, la documentación de paquetes y la documentación de versiones dentro del mismo shell

## Familias de historias incluidas

- feedback, superposiciones, enmascarado de viewport, formularios, navegación, visualización de datos, composición del shell y efectos de movimiento/shader
- la historia de comparación densa demuestra cada variante visual de `table()`,
  cada serialización pipe explícita y la vía `navigableTableSurface()`
  controlada por el teclado
- `motion-and-shader-effects` ahora cubre ondas de shader de cuadrantes, campos Braille, raytracing ajustado a glifos y orquestación de resortes y líneas de tiempo en los perfiles rich, static, pipe y accessible

## Teclas

- `Enter`: entrar en la documentación desde la página de aterrizaje
- `Esc` / `q`: salir desde la página de aterrizaje
- `↑` / `↓`: recorrer los modos de calidad de la pantalla de aterrizaje antes de entrar en la documentación
- `1` `2` `3` `4` `5`: cambiar los ajustes preestablecidos de tema de la pantalla de aterrizaje
- `←` / `→`: recorrer los temas de la pantalla de aterrizaje
- `[` / `]`: moverse entre las secciones de documentación de nivel superior
- `?`: abrir la ayuda de teclado
- `/`: buscar historias de componentes y páginas de documentación en la superficie de búsqueda estándar del shell
- `F2`: abrir el cajón de ajustes estándar del shell
- Acento grave: activar o desactivar el HUD de rendimiento estándar del shell
- `↑` / `↓`: moverse por las filas del panel con el foco
- `Enter` / `Space`: abrir la guía con el foco, expandir una familia, seleccionar un componente o activar la fila con el foco
- `←` / `→`: contraer o expandir la familia con el foco en el carril izquierdo dentro de `Components`
- `Tab` / `Shift+Tab`: mover el foco entre paneles
- `j` / `k`: desplazar el panel de documentación o de demo con el foco
- `d` / `u`: paginar el panel de documentación o de demo con el foco
- `1` `2` `3` `4`: cambiar entre los perfiles rich, static, pipe y accessible
- `,` / `.`: variante de historia anterior o siguiente dentro de `Components`
- `?`: abrir o cerrar la ayuda de teclado
- `q` / `Esc`: abrir el modal estándar de confirmación de salida

## Notas

- Esto es intencionadamente más pequeño que el showcase existente. Es un producto de documentación viva en curso, aún no la referencia final.
- La documentación es la demo: el texto de la página y la vista previa se generan a partir de los mismos datos de historia estructurados.
- La pantalla de título es deliberadamente sobria, no completamente vacía. Conserva solo la indicación de entrada y las marcas de la marca sobre el tratamiento del shader.
- Las secciones `Guides`, `Packages`, `Philosophy` y `Release` ya no son solo la forma del shell. Ahora publican páginas reales del corpus dentro de la aplicación, y el contrato de smoke orientado a versiones ahora se ejecuta a través de DOGFOOD en lugar del amplio árbol de ejemplos.
- El shell de documentación ya expone la búsqueda a nivel de shell mediante la paleta de comandos estándar del marco, de modo que los usuarios pueden saltar directamente a las guías o historias de componentes que coincidan en lugar de recorrer primero cada lista a mano.
- `npm run blocklab` abre un banco de trabajo interactivo independiente de desarrollo y pruebas de componentes sobre el catálogo de historias.
- `npm run blocklab:index` expone el catálogo de historias como una estación de trabajo determinista, centrada en el texto, para agentes, CI y futuras herramientas MCP o de bloques. `npm run storybook`, `npm run storybook:index` y `npm run dogfood:storybook` se mantienen como alias de compatibilidad durante la ventana del cambio de nombre.
- DOGFOOD ahora también usa el cajón de ajustes estándar propiedad del shell, de modo que `F2`, la paleta de comandos o los atajos del marco del shell pueden alternar preferencias visibles como las indicaciones de controles del pie y la calidad del aterrizaje sin que la aplicación de documentación incluya su propia infraestructura de superposiciones.
- La calidad del aterrizaje también se puede ajustar directamente desde la pantalla de aterrizaje, para que los usuarios vean el efecto antes de salir del tratamiento del título.
- El shell de documentación usa variantes de diseño responsivo explícitas: wide mantiene visibles la navegación, el contenido y el contexto de metadatos/variantes; standard y narrow pliegan los paneles secundarios; tiny muestra un único panel de contenido útil en lugar de una superficie de varias columnas aplastada.
- Las filas de ajustes ahora llevan descripciones secundarias reales, los interruptores se muestran con indicadores tipo casilla `☐` / `☑`, y las filas de elección usan un marcador de ciclo distinto para que el cajón se lea como una superficie de ajustes de producto y no como una simple lista de texto.
- El foco ahora es dueño de la entrada en el explorador: el carril de familias gestiona las teclas de exploración y expansión solo mientras está activo, el carril de variantes puede gestionar los cambios de variante con las flechas, y los clics en paneles o `Tab` mueven esa propiedad a través del shell de marco estándar en lugar de dejar que los carriles inactivos sigan respondiendo.
- El pie es ahora la superficie de control fiel del explorador: las indicaciones del shell siguen visibles, las pistas del panel activo solo aparecen cuando realmente pueden hacer algo, y las leyendas obsoletas dentro de los paneles ya no quedan bajo las superposiciones del shell ni tras cambios de foco.
- Cuando no hay ningún componente seleccionado, el carril central actúa como superficie de incorporación: presenta Bijou y explica cómo explorar, buscar, configurar y navegar la documentación antes de que el usuario abra un componente.
- El espacio de trabajo del explorador ahora mantiene una celda de margen alrededor de las tres columnas principales y entre ellas, para que el chrome del shell y los rieles de los paneles no parezcan cortados en los bordes del marco.

[← DOGFOOD](../../docs/book/bijou-designs.pdf#page=292)
