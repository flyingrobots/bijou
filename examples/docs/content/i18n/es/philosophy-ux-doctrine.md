---
title: "Doctrina UX de Bijou"
summary: "La doctrina de producto para una UX de terminal serena, explícita y humana."
---

# DOCTRINA UX DE BIJOU

Bijou es un motor de UI de terminal de alta fidelidad con una postura de diseño explícita sobre la verdad del runtime, la honestidad del shell y la interacción centrada en las personas.

## Principios fundamentales

### 1. El foco es dueño de la entrada
La región activa debe ser inequívoca y poseer la superficie de control principal. El usuario nunca debería preguntarse si una pulsación afecta al panel actual, a un modal oculto o a una pista obsoleta del pie.

### 2. Los controles visibles son una promesa
Si una pista de control es visible, debe funcionar en la capa activa. Anunciar controles inactivos o tapados es un fallo de integridad del shell.

### 3. Selección estructural
La selección debe comunicarse mediante relleno de fondo, énfasis estructural o glifos posicionales. El color puede reforzar la selección, pero no debe ser el único elemento diferenciador.

### 4. La densidad requiere ritmo
La densidad de una TUI es una fortaleza industrial, no una licencia para el ruido visual. Hay que preservar los márgenes interiores, los márgenes y un ritmo coherente entre etiquetas y valores.

### 5. El shell es un producto
El marco de la aplicación (cabecera, pie, ayuda, búsqueda, ajustes y notificaciones) es un producto unificado de cara a las personas. Existe para orientar al operador, centralizar el comportamiento común y reducir la ansiedad.

### 6. La degradación elegante es una obligación
El modo interactivo enriquecido es un perfil. Bijou preserva la verdad semántica en los modos `static`, `pipe` y `accessible`. Los perfiles inferiores no necesitan paridad visual; requieren honestidad semántica.

### 7. La accesibilidad es una propiedad del sustrato
Bijou tiene en cuenta el orden de lectura, la baja visión, el daltonismo y la carga cognitiva a nivel del motor. Una aplicación no es accesible solo porque un componente pueda degradarse a texto.

### 8. La localización es geométrica
El locale afecta a la redacción, al ajuste de líneas y a la dirección de lectura. Bijou evita suposiciones codificadas que prioricen el inglés o los layouts LTR.

### 9. Las superficies de IA deben explicarse
La salida mediada por IA debe ser explícita sobre su naturaleza, sus evidencias y su grado de confianza. Debe guiar al operador hacia la siguiente acción esperada.

## Patrones de interacción

- **Teclado primero, ratón como mejora**: Todo lo importante sigue siendo accesible con el teclado. En la práctica, el shell sigue siendo de teclado primero con el ratón como mejora, y la entrada del ratón enriquece este modelo veraz mediante la interacción espacial.
- **La capa superior se descarta primero**: Las TUI con capas deben ser predecibles. Las capas deben descartarse desde arriba, y la capa descartable superior es la primera que descarta `Esc`.
- **La capa superior es dueña de los controles visibles**: La capa de arriba es dueña de los indicadores, controles y vías de escape visibles hasta que cede o se descarta; dicho llanamente, lo que está arriba es dueño de los controles visibles.
- **DOGFOOD es el banco de pruebas**: La propia documentación debe ejercitar de forma veraz el shell, la búsqueda y la postura de accesibilidad.
- **La doctrina antes que los Blocks**: Los Blocks llegan después de la doctrina. Los Blocks reutilizables llegan después de la doctrina de interacción, no antes; la política debe dar forma a los componentes y no al revés.

---
**El objetivo es llevar el terminal de una colección de widgets a una base sólida para aplicaciones profesionales.**
