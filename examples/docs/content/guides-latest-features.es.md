# Funciones recientes

Esta guía describe el checkout de trabajo: versión del paquete
{{RELEASE_VERSION}}, línea {{RELEASE_LINE}}. Las funciones bajo Unreleased en
`docs/CHANGELOG.md` pueden estar disponibles aquí antes de publicarse en un
paquete. Una demostración en ejecución no prueba una publicación estable.

## Fuentes rasterizadas

`@flyingrobots/bijou-tui` exporta `RasterFont`, `RasterFontGlyph`,
`layoutRasterText()`, `rasterizeText()` y `rasterTextSurface()`.
El núcleo consume cobertura de glifos precompilada e inmutable y métricas de
avance. La decodificación de archivos pertenece a un adaptador. La demo Markdown
usa OpenType.js para archivos TTF/OTF locales y Google Fonts. DOGFOOD carga
pequeños atlas sin conexión.

```typescript
import { RasterFont, RasterFontGlyph, rasterTextSurface } from '@flyingrobots/bijou-tui';

const glyph = new RasterFontGlyph({
  advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2,
}, new Uint8Array([0b1001]));
const font = new RasterFont({
  family: 'Fixture', lineHeight: 3, glyphs: new Map([['A', glyph]]),
});
const surface = rasterTextSurface('AAA', font, {
  columns: 30, rows: 6, renderer: { kind: 'braille' },
});
```

La salida RGBA alimenta la misma canalización de Braille, bloques de cuadrantes
o caracteres personalizados. El layout admite puntos de código, saltos de línea
y márgenes negativos; no realiza shaping, bidi ni kerning. Los glifos ausentes
necesitan un reemplazo explícito. Al reducir se conservan los texeles cubiertos
del atlas para no perder trazos finos. Los trazos menores que un píxel pueden
engrosarse y los huecos menores que un píxel pueden cerrarse.

La API limita longitud, memoria de salida, trabajo con glifos y tamaño de
superficie. Consulta **Packages → @flyingrobots/bijou-tui → Raster Fonts** para
los límites completos y el formato de cobertura.

## Demo de tipografía Markdown

Ejecuta desde la raíz del repositorio:

```sh
npm run markdown-font -- examples/markdown-font/sample.md --configure
npm run markdown-font -- document.md --font ./MyFont.otf
npm run markdown-font -- document.md --google-font "Lora"
npm run markdown-font -- document.md --offline --no-animation
npm run markdown-font -- document.md --offline --h1-size 36 --p-size 12
```

El selector interactivo de Google Fonts busca en un catálogo descargado.
Space Grotesk está incluida para uso sin conexión. Las descargas permanecen
en memoria durante la ejecución; no hay caché persistente. Cada petición tiene
un plazo de 15 segundos. Catálogos y fuentes tienen un límite de 8 MiB cada uno;
CSS, 64 KiB; documentos, 1 MiB. Las familias que requieren varios subconjuntos
o no ofrecen un único archivo TrueType necesitan un TTF/OTF local. Las fuentes
variables usan sus contornos predeterminados; no se admiten fuentes de color
ni de mapa de bits.

Cada elemento `h1`, `h2`, `h3`, `h4` y `p` acepta `--ELEMENT-font` y
`--ELEMENT-size`. Los valores de fuente incluyen familias de Google, rutas
TTF/OTF, `google:FAMILY`, `file:PATH`, `default` y `terminal`. Los tamaños son
alturas de tinta de 4 a 256 píxeles; Braille usa `ceil(size / 4)` filas. Indicar
solo el tamaño activa la fuente predeterminada. H1 comienza con 24 píxeles;
los demás elementos mantienen texto normal hasta configurarse. Listas, tablas,
citas y código siguen siendo bloques Markdown normales. Los ajustes afectan
a esta ejecución, no al documento fuente.

Los colores recorren el gradiente de marca del tema activo a 10 FPS. Las flechas
o la rueda desplazan; Espacio pausa o reanuda; q o Ctrl+C sale. Redimensionar
reajusta el texto. `--no-animation` imprime en el historial del terminal. Los
caracteres no admitidos, títulos de más de 256 unidades UTF-16, párrafos de más
de 20.000 unidades y vistas muy estrechas conservan texto. La salida rasterizada
se limita a 1.048.576 celdas por documento. Consulta el contrato CLI completo en
`examples/markdown-font/README.md`.

## Significado en cada modo

El renderizador genera la imagen de la fuente. El componente que lo contiene
conserva el texto y elige su presentación.

| Presentación | Demo Markdown | Indicación de entrada de DOGFOOD |
| :--- | :--- | :--- |
| Interactiva | Geometría y animación del tema | Space Grotesk y recorrido de color |
| Estática | Texto rasterizado inmóvil | Palabras localizadas |
| Pipe / accesible | Texto; pipe puede solicitar `--raster` | Palabras localizadas |
| Glifos ausentes / poco espacio | Texto de respaldo | Texto de respaldo |

`NO_COLOR` suprime el color sin cambiar la interactividad detectada. La demo
Markdown además elige salida estática cuando se desactiva el color. No interpreta
`NO_COLOR` como ausencia de capacidades de cursor o entrada.

## Temas del libro y pantalla de título

DOGFOOD usa por defecto temas oscuro y claro inspirados en el libro, con coral
y neutros cálidos. Los otros temas siguen disponibles en ajustes. Theme Lab y
Theme Inspector con F10 muestran tokens y diagnósticos. Son temas de DOGFOOD,
no sustitutos de los presets globales de la biblioteca.

Los glifos Jacquard 12 giran en un cilindro sobre ruido ASCII tenue. La indicación
localizada «Press [Enter]» usa Space Grotesk en dos o tres filas cuando cabe.
Ambas fuentes están incluidas con licencia. La indicación usa un atlas de ASCII
imprimible y vuelve al texto para otras escrituras. Para comprobar reproducibilidad:

```sh
npm run check:dogfood:title
npm run check:dogfood:prompt
```

## Referencias actuales y documentos históricos

El libro didáctico ahora está en `flyingrobots/bijou-job-monitor`; su aplicación
está fijada a Bijou 7.2.0. La edición completa y los 426 registros fuente de este
repositorio son evidencia histórica preservada. DOGFOOD etiqueta los artículos
del archivo como **Referencia histórica**. Sus afirmaciones mantienen su alcance
original y no se actualizan automáticamente al checkout actual.

Usa esta guía, los README actuales, los ejemplos ejecutables y el changelog para
el comportamiento reciente. **Historia actual de la versión** sigue la versión
en ejecución en los cuatro idiomas admitidos. **Packages → @flyingrobots/bijou-mcp**
documenta el adaptador MCP, sus salidas estructuradas y la alternativa de enlaces en texto.
GitHub Issues y los hitos siguen siendo la autoridad para el trabajo pendiente.
