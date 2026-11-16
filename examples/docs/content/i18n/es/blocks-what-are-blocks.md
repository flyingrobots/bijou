---
title: "Qué son los Blocks"
summary: "La postura del sistema de diseño para los ensamblajes más grandes y con criterio propio de Bijou."
---

# Blocks

Este documento define qué entiende Bijou por un Block reutilizable.

Los Blocks son ensamblajes más grandes y con criterio propio, construidos a partir de patrones canónicos y familias de componentes.

## Qué es un Block

Un Block no es:

- una composición de demostración puntual
- un único componente primitivo
- un apaño específico del shell que solo entiende una superficie de prueba

Un Block es:

- un ensamblaje reutilizable a nivel de producto
- compuesto a partir de patrones canónicos
- construido con familias de componentes existentes y reglas de propiedad de la TUI
- documentado con funciones claras, propiedad y expectativas de degradación

Los Blocks llegan después de la doctrina, los patrones y los componentes.

Ese orden importa:

1. la doctrina explica cómo debería sentirse una buena UX de Bijou
2. los patrones explican el lenguaje de interacción recurrente
3. las familias de componentes aportan primitivas reutilizables
4. los Blocks componen esas primitivas en estructuras de producto repetibles

Si un Block aparece antes de que las tres primeras capas estén claras, suele codificar gustos accidentales en lugar de un lenguaje reutilizable.

## Qué deben estandarizar los Blocks

Los Blocks deben estandarizar:

- la composición
- la estructura
- el ritmo del texto
- la propiedad del foco
- las facilidades comunes del shell o del flujo de trabajo

Los Blocks no deben ocultar:

- la propiedad de interacciones importantes
- el comportamiento de degradación
- la semántica de accesibilidad
- las suposiciones de localización o de dirección

## Contrato público actual

Bijou expone ahora desde `@flyingrobots/bijou` un contrato de autoría de Blocks
basado primero en metadatos:

- `BlockMetadata` declara el paquete, el nombre, la familia, la escala, los modos, las ranuras,
  las variantes, las opciones de configuración, los componentes que lo componen, los hechos semánticos, los id de historias y la
  documentación de un Block.
- `BlockDefinition` empareja esos metadatos con una función de renderizado explícita.
- `BlockPackageManifest` declara los Blocks exportados, la versión del paquete, el rango de
  peer de Bijou, la documentación y las etiquetas para su distribución normal por NPM.
- `defineBlock()` y `defineBlockPackage()` validan las definiciones antes de que
  los autores las publiquen o indexen.
- `defineBlock()` puede adjuntar contratos de datos de vista DX-034 e intenciones de comando para
  su descubrimiento sin handles de proveedores ni callbacks de comandos.
- `appShellBlock`, `readerSurfaceBlock`, `inspectorPanelBlock`,
  `inlineStatusBlock`, `inFlowStatusBlock`, `transientOverlayBlock`,
  `activityStreamBlock`, `shortcutCueBlock`, `progressIndicatorBlock`,
  las exportaciones de Blocks de familias de componentes de DOGFOOD, `standardBlocks`,
  `standardBlockStories` y
  `standardBlockPackageManifest` exponen las definiciones de Blocks propias:
  AppShell, ReaderSurface, InspectorPanel, estado en línea, estado dentro del flujo,
  avisos de superposición transitoria, flujo de actividad, pistas de atajos, progreso,
  agrupación, explicabilidad, documentos, enlaces, divisores, entrada de texto, opciones,
  navegación, divulgación, progreso de ruta, énfasis de marca, primitivas sensibles al modo,
  comparaciones densas, jerarquías, listas de exploración y vistas de dependencias
  temporales.
  Sus funciones de renderizado producen ahora una salida de primera prueba determinista en los modos
  interactive, static, pipe y accessible, mientras mantienen el ciclo de vida de los proveedores,
  el despacho de comandos y el comportamiento de AppShell en producción fuera de la
  capa de definición de Blocks.
- `defineAppShellComposition()` agrupa Blocks respaldados por el runtime en ranuras lógicas de
  navegación, contenido, inspector, estado y superposición sin renderizar.
- `blockRenderNode()` y `renderBlockTree()` renderizan explícitamente declaraciones de Blocks
  anidados cuando un host o una vista previa quiere la salida de Blocks hijos dentro de las ranuras
  del padre. El `block.render()` normal sigue siendo un contrato de renderizado local de un solo Block.
- `defineBlockSchemaAdapter()`, `defineSchemaBlock()` y
  `bindSchemaBlockInput()` validan los datos desconocidos del límite antes de producir la entrada
  de renderizado del Block y los hechos de enlace.
- `validateBlockMetadata()`, `blockMetadataSummary()` y las utilidades de informes ofrecen a
  las pruebas, la documentación, DOGFOOD, las cargas de MCP y los agentes una forma determinista de inspeccionar
  los hechos de un Block sin renderizar una superficie de terminal.

Los Blocks se describen antes de renderizarse, los autores de paquetes evitan el registro global
oculto y las herramientas pueden descubrir directamente las ranuras y los modos admitidos.
Los Blocks vinculados a esquemas validan los datos desconocidos del límite sin que los esquemas de Zod, GraphQL
o bases de datos pasen a formar parte de la superficie de dependencias del núcleo de Blocks. Las
suscripciones de proveedores, el recorrido activo de jerarquías, el AppShell renderizado y las capturas
multimodo de Blocks de DOGFOOD siguen siendo trabajo pendiente.

## Primeros candidatos creíbles a Block

### Marco de aplicación

El shell con marco ya es una de las estructuras recurrentes más sólidas de Bijou.

Como futuro Block, `App frame` debería estandarizar:

- el ritmo de los paneles
- el tratamiento de la región activa
- la propiedad de la cabecera y el pie del shell
- las superposiciones del shell, como los ajustes y la ayuda

### Cajón de ajustes

El cajón de ajustes es un futuro Block creíble porque ya tiene:

- filas de preferencias canónicas
- comportamiento de descarte y descubrimiento propiedad del shell
- un ritmo de secciones estable
- un tratamiento veraz de la fila activa

Como Block, debería ser reutilizable sin depender de código específico de DOGFOOD.

### Centro de notificaciones

El centro de notificaciones es un probable Block futuro cuando se retome el trabajo de Humane Terminal.

Con el tiempo debería estandarizar:

- las filas de avisos
- la revisión del archivo y el historial
- el ritmo de los filtros
- el comportamiento, propiedad del shell, de interrupción frente a revisión

### Flujo guiado

El flujo guiado es la familia de Blocks general para:

- la incorporación
- las secuencias de configuración
- los recorridos explicativos
- los flujos asistidos de varios pasos

Debería componer:

- filas de preferencias
- alertas y notas
- lenguaje de pasos o de línea temporal
- siguientes acciones explícitas

DL-005 demuestra la primera costura canónica de esta familia mediante `explainability()`, que convierte la doctrina de explicabilidad de la IA en una superficie estructurada de flujo guiado en lugar de dejarla solo como prosa.
DL-008 promueve la costura reutilizable del Block mediante `guidedFlow()`, que estandariza una asistencia de varios pasos más serena, el ritmo de las secciones y el tratamiento de la siguiente acción sin obligar a cada superficie guiada a hacerse pasar por explicabilidad de IA.

### Panel inspector

Un panel lateral de tipo inspector es otro candidato sólido porque combina de forma natural:

- secciones con título
- texto de apoyo
- énfasis en el valor actual
- un espaciado compacto pero sereno

DL-006 demuestra ahora la primera costura canónica de esta familia mediante `inspector()`, que convierte el ritmo del panel inspector en un componente reutilizable del núcleo en lugar de dejarlo atrapado en un cuadro de detalle hecho a medida de DOGFOOD.
DL-007 promueve la primera costura a nivel de Block de esta familia mediante `inspectorDrawer()`, que estandariza la composición del inspector acoplado a un cajón en los shells de TUI en lugar de dejar que los cajones inspectores existentes compongan cadenas a mano.

## Criterio de aceptación de Blocks

Una estructura está lista para convertirse en un Block canónico cuando:

- se repite en más de una superficie o necesidad de producto
- la propiedad de su interacción es estable
- sus patrones ya son canónicos en otros lugares
- su historia de degradación es explícita
- mejora la reutilización en lugar de atrapar más calidad dentro de un único shell

## Qué no hacer

- no conviertas en Block cada demostración vistosa
- no dejes que los Blocks se salten los patrones canónicos
- no dejes que los Blocks se conviertan en suposiciones de almacenamiento, servicios o dominio de la aplicación
- no trates los Blocks como el primer lugar en el que se tienen en cuenta la accesibilidad o la localización

## Relación con el ciclo actual

DL-002 no implementa un runtime de Blocks.

Este ciclo existe para hacer explícita la capa de Blocks, de modo que los ciclos futuros puedan promover estructuras recurrentes reales de forma deliberada y no accidental.
