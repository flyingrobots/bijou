---
title: "Vista previa de Blocks"
summary: "Un índice de vista previa respaldado por código para los Blocks estándar, sus variantes y las historias declaradas."
---

# Vista previa de Blocks

Selecciona un Block en la navegación lateral para ver su ejemplo de TUI en vivo, la vista previa de su degradación y su documentación. La visión general mantiene legible el inventario del paquete sin renderizar todos los Blocks a la vez.

## Blocks disponibles

## AppShell

Compone las regiones lógicas de la aplicación para navegación, contenido, inspección, estado y superposiciones.

Variantes: wide (Ancho), narrow (Estrecho)

Historias:
- app-shell.ready - Shell listo - ready
- app-shell.narrow - Shell estrecho - narrow
- app-shell.overlay - Shell con superposición - overlay

## ReaderSurface

Compone contenido legible con navegación y contexto de esquema opcionales.

Variantes: article (Artículo), loading (Cargando)

Historias:
- reader-surface.ready - Lector listo - ready
- reader-surface.loading - Lector cargando - loading
- reader-surface.stale - Lector obsoleto - stale
- reader-surface.empty - Lector vacío - empty
- reader-surface.error - Error del lector - error

## InspectorPanel

Explica la selección actual con hechos y acciones de origen opcionales.

Variantes: selection (Selección), empty (Vacío)

Historias:
- inspector-panel.ready - Inspector listo - ready
- inspector-panel.empty - Inspector vacío - empty
- inspector-panel.loading - Inspector cargando - loading
- inspector-panel.stale - Inspector obsoleto - stale
- inspector-panel.error - Error del inspector - error

## InlineStatusBlock

Añade hechos de estado concisos a etiquetas, filas y pistas de comandos sin depender solo del color para transmitir significado.

Variantes: ready (Listo)

Historias:
- inline-status.ready - Estado en línea listo - ready

## InFlowStatusBlock

Muestra mensajes de estado duraderos dentro del flujo con hechos de gravedad, origen, acción y modos inferiores.

Variantes: ready (Listo)

Historias:
- in-flow-status.ready - Estado en el flujo listo - ready

## TransientOverlayBlock

Anuncia estados de corta duración con hechos de prioridad, descarte y texto accesible.

Variantes: ready (Listo)

Historias:
- transient-overlay.ready - Superposición transitoria lista - ready

## ActivityStreamBlock

Muestra eventos cronológicos con hechos del evento seleccionado y de modos inferiores.

Variantes: ready (Listo)

Historias:
- activity-stream.ready - Flujo de actividad listo - ready

## ShortcutCueBlock

Muestra pistas de atajos en línea con semántica de tecla, acción, ámbito y modos inferiores.

Variantes: ready (Listo)

Historias:
- shortcut-cue.ready - Pista de atajo lista - ready

## ProgressIndicatorBlock

Expone la etiqueta, el valor, el total, el porcentaje y los hechos de progreso para modos inferiores.

Variantes: ready (Listo)

Historias:
- progress-indicator.ready - Indicador de progreso listo - ready

## FramedGroupBlock

Agrupa contenido relacionado en una región con marco, con hechos de título, elemento seleccionado y agrupación para modos inferiores.

Variantes: ready (Listo)

Historias:
- framed-group.ready - Grupo con marco listo - ready

## ExplainabilityWalkthroughBlock

Explica por qué cambió un estado con hechos de pasos ordenados, evidencias, decisión y siguiente acción.

Variantes: ready (Listo)

Historias:
- explainability-walkthrough.ready - Recorrido explicativo listo - ready

## FormattedDocumentBlock

Publica prosa persistente con hechos de encabezado, cuerpo, aviso y código que se conservan en los modos inferiores.

Variantes: ready (Listo)

Historias:
- formatted-document.ready - Documento con formato listo - ready

## LinkDestinationBlock

Describe un destino navegable con hechos de etiqueta, destino, tipo, estado y enlace para modos inferiores.

Variantes: ready (Listo)

Historias:
- link-destination.ready - Destino de enlace listo - ready

## DividerBlock

Separa secciones con una línea estructural etiquetada que sigue teniendo sentido en los modos pipe y accessible.

Variantes: ready (Listo)

Historias:
- divider.ready - Divisor listo - ready

## TextEntryBlock

Describe el estado de una entrada de texto con hechos de campo, valor, marcador de posición, validación y resultado.

Variantes: ready (Listo)

Historias:
- text-entry.ready - Entrada de texto lista - ready

## SingleChoiceBlock

Describe un control de elección única con hechos de lista de opciones, valor seleccionado, modo y validación.

Variantes: ready (Listo)

Historias:
- single-choice.ready - Elección única lista - ready

## MultipleChoiceBlock

Describe una lista de verificación con hechos de elementos marcados, no marcados, resumen de la selección y validación.

Variantes: ready (Listo)

Historias:
- multiple-choice.ready - Elección múltiple lista - ready

## BinaryDecisionBlock

Describe una decisión de sí/no con hechos sobre la opción seleccionada, la consecuencia, la confirmación y el motivo de desactivación.

Variantes: ready (Listo)

Historias:
- binary-decision.ready - Decisión binaria lista - ready

## PeerNavigationBlock

Describe la navegación entre elementos hermanos con hechos de anterior, actual, siguiente, ruta y disponibilidad.

Variantes: ready (Listo)

Historias:
- peer-navigation.ready - Navegación entre pares lista - ready

## ProgressiveDisclosureBlock

Describe contenido expandible con estado de despliegue, recuento de elementos ocultos, resumen y detalles.

Variantes: ready (Listo)

Historias:
- progressive-disclosure.ready - Divulgación progresiva lista - ready

## PathProgressBlock

Describe el estado de progreso de rutas de navegación y pasos con hechos de ruta, paso actual, ordinal, total y estado.

Variantes: ready (Listo)

Historias:
- path-progress.ready - Progreso de ruta listo - ready

## BrandEmphasisBlock

Describe el énfasis de marca y decorativo con semántica explícita de decoración no esencial.

Variantes: ready (Listo)

Historias:
- brand-emphasis.ready - Énfasis de marca listo - ready

## ModeAwarePrimitiveBlock

Captura la salida de primitivas personalizadas con contratos de modo explícitos y semántica de hecho/valor.

Variantes: ready (Listo)

Historias:
- mode-aware-primitive.ready - Primitiva sensible al modo lista - ready

## DenseComparisonBlock

Publica filas de comparación densas con hechos de métrica, valor izquierdo, valor derecho, diferencia y fila seleccionada.

Variantes: ready (Listo)

Historias:
- dense-comparison.ready - Comparación densa lista - ready

## HierarchyBlock

Describe el estado de un árbol con hechos de raíz, nodos, nodo seleccionado, padre, profundidad y expansión.

Variantes: ready (Listo)

Historias:
- hierarchy.ready - Jerarquía lista - ready

## ExplorationListBlock

Combina título, faceta, elementos, elemento seleccionado y detalle de vista previa en un Block de exploración.

Variantes: ready (Listo)

Historias:
- exploration-list.ready - Lista de exploración lista - ready

## TemporalDependencyBlock

Muestra hechos de línea temporal y dependencias con semántica de secuencia, evento seleccionado y depende-de.

Variantes: ready (Listo)

Historias:
- temporal-dependency.ready - Dependencia temporal lista - ready
