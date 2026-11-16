---
title: "Flujo de trabajo de @flyingrobots/bijou-i18n"
summary: "@flyingrobots/bijou-i18n-tools + @flyingrobots/bijou-i18n-tools-node"
---

# Flujo de trabajo de i18n

El flujo de localización de Bijou se reparte entre el runtime, las herramientas puras y los adaptadores
de sistema de archivos de Node. La regla es sencilla:

```text
source string table
  -> generated per-locale runtime catalogs
  -> English fallback catalog plus selected locale loaded by the runtime
  -> runtime-backed LocalizationPort
  -> localized objects consumed by views
```

El código de runtime no debe analizar hojas de cálculo, archivos CSV ni todos los idiomas a
la vez. Producción debe cargar el catálogo inglés generado como alternativa y
después cargar los catálogos JSON generados del idioma seleccionado. En Node,
`createRuntimeCatalogDirectoryLoader()` lee ese directorio de catálogos del idioma seleccionado
para el runtime de i18n.

## Funciones de los paquetes

- `@flyingrobots/bijou-i18n`: catálogos de runtime, cambio de idioma, búsqueda
  de alternativas, dirección, puertos de formato y el contrato `LocalizationPort`
  orientado a la app.
- `@flyingrobots/bijou-i18n-tools`: herramientas de autoría neutrales respecto al proveedor para tablas
  de cadenas, intercambio de libros, detección de obsolescencia y generación de catálogos de runtime.
- `@flyingrobots/bijou-i18n-tools-node`: helpers de sistema de archivos de Node para leer
  tablas de cadenas, escribir catálogos de runtime generados y cargar el directorio de
  un idioma.
- `@flyingrobots/bijou-i18n-tools-xlsx`: paquete adaptador opcional de hojas de cálculo
  para el intercambio de libros XLSX.

## Tabla de origen

Usa una única tabla de cadenas CSV o TSV confirmada como fuente de autoría. La tabla
actual de DOGFOOD está en:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Cada fila indica el espacio de nombres, el id de la cadena, el idioma de origen, el idioma de destino,
el estado de la traducción y el valor codificado. Las traducciones que faltan siguen visibles en la
tabla en lugar de desaparecer en el comportamiento de alternativa del runtime.

## Genera los catálogos de runtime

Genera los catálogos JSON de runtime a partir de la tabla de origen:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

DOGFOOD escribe los catálogos generados en:

```text
examples/docs/i18n/catalogs/<locale>/<namespace>.json
```

Por ejemplo, las cadenas francesas de DOGFOOD se generan en:

```text
examples/docs/i18n/catalogs/fr/bijou.dogfood.json
```

Ese archivo contiene solo valores en francés. Los valores de origen en inglés permanecen en la tabla
de origen y en el catálogo de runtime inglés generado. No incluye español,
alemán ni ningún otro idioma.

## Carga un solo idioma

En tiempo de ejecución, carga el directorio del idioma seleccionado:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createRuntimeCatalogDirectoryLoader } from '@flyingrobots/bijou-i18n-tools-node';

const loader = createRuntimeCatalogDirectoryLoader({
  rootDir: './i18n/catalogs',
});
const englishCatalogs = await loader('en');

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: englishCatalogs,
  loader,
});
```

Cambiar de idioma debe cargar los catálogos JSON generados del nuevo idioma y
reemplazar la carga anterior del catálogo del idioma seleccionado. La composición de la app puede conservar el
runtime para activar catálogos, pero las vistas deben usar un `LocalizationPort`
y recibir objetos localizados. No deben leer CSV ni archivos JSON, procesar el estado
del idioma ni manejar directamente handles del proveedor de traducción.

```ts
import {
  createRuntimeLocalizationPort,
  type LocalizationPort,
} from '@flyingrobots/bijou-i18n';

const localization: LocalizationPort = createRuntimeLocalizationPort(runtime);
const labelResult = localization.resolve({
  key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
});
const label = labelResult.value ?? 'Language';
```

En builds que no son de producción, las cadenas que faltan en el idioma seleccionado deben ser llamativas en lugar
de legibles en silencio. DOGFOOD usa un marcador brillante de localización ausente para esa
ruta:

```text
<MISSING LOC STRING KEY=bijou.dogfood:docs.page.guides>
```

Los builds de producción mantienen cargados los catálogos ingleses de alternativa para que las traducciones
incompletas sigan renderizando una UI legible.

## Añade un idioma

1. Añade el idioma a la lista de opciones de idioma de la app.
2. Añade filas para ese idioma en la tabla de cadenas de origen.
3. Marca las filas traducidas como `current`; deja las que faltan como `missing`.
4. Ejecuta `npm run dogfood:i18n:build`.
5. Ejecuta `npm run dogfood:i18n:check` en CI o en la preparación de la versión.
6. Ejecuta `npm run dogfood:i18n:coverage` para ver los recuentos de traducidas y pendientes.

Para el intercambio con proveedores o traductores, exporta libros desde la misma fuente:

```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
```

## Reglas de arquitectura

- Mantén la localización detrás de puertos y adaptadores de runtime.
- Resuelve los textos de app/vista mediante `LocalizationPort`, no con búsquedas directas de cadenas
  en el runtime.
- Mantén la conversión de tablas de cadenas en `@flyingrobots/bijou-i18n-tools`.
- Mantén las lecturas y escrituras del sistema de archivos en `@flyingrobots/bijou-i18n-tools-node`.
- Mantén las cargas del runtime limitadas al idioma seleccionado.
- Mantén la alternativa inglesa cargada por separado en producción.
- Mantén llamativas en desarrollo las cadenas que faltan en el idioma seleccionado.
- Mantén las vistas libres de handles de proveedor, lecturas del sistema de archivos y análisis de CSV.
