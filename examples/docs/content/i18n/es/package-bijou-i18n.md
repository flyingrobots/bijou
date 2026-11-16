---
title: "@flyingrobots/bijou-i18n"
summary: "El runtime de localización en memoria para catálogos, dirección y búsquedas seguras en tiempo de ejecución."
---

# @flyingrobots/bijou-i18n

El runtime de localización en memoria de Bijou.

`@flyingrobots/bijou-i18n` ofrece:

- catálogos con espacios de nombres
- locale y dirección
- búsqueda de mensajes
- búsqueda genérica de recursos
- referencias seguras en tiempo de ejecución
- costuras de formato sensibles al locale
- catálogos de respaldo explícitos
- formato inyectable de mensajes para localizaciones ausentes
- compatibilidad con cargadores asíncronos de locales para activar catálogos integrados en el runtime
- un `LocalizationPort` de cara a la aplicación que resuelve objetos localizados
  estructurados
- `isJsonShapedLocalizedValue()` para comprobar en el adaptador la conformidad de las cargas
  de recursos y datos

Este paquete es intencionadamente solo de runtime. Los flujos con hojas de cálculo, la detección de entradas obsoletas, la pseudolocalización y la compilación de catálogos corresponden a `@flyingrobots/bijou-i18n-tools`.

## Costura del cargador

Usa `createI18nRuntime()` para catálogos totalmente precargados, o
`createI18nRuntimeAsync()` cuando los catálogos deban cargarse de forma diferida:

```ts
import { createI18nRuntimeAsync, type I18nCatalogLoader } from '@flyingrobots/bijou-i18n';

const loader: I18nCatalogLoader = async (locale) => {
  const module = await import(`./catalogs/${locale}.js`);
  return module.catalogs;
};

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader,
});
```

Cuando las cargas del runtime se generan como catálogos puros por locale, carga el catálogo
fuente o de respaldo por separado:

```ts
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
```

Las aplicaciones de producción pueden usar catálogos de respaldo para que las traducciones ausentes sigan siendo legibles.
Las aplicaciones de desarrollo pueden inyectar `missingMessage` para mostrar un marcador llamativo en lugar de
recurrir discretamente al respaldo cuando al locale seleccionado le falta una cadena:

```ts
const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
});
```

La misma costura del cargador admite también paquetes de locale respaldados por archivos mediante
`@flyingrobots/bijou-i18n-tools-node`:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createCatalogBundleFileLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createCatalogBundleFileLoader({
    resolvePath: (locale) => `./i18n/${locale}.json`,
  }),
});
```

Una vez creado, el runtime puede precargar y activar locales de forma explícita:

```ts
await runtime.preloadLocale('de');
await runtime.setLocale('de');
```

## Puerto de localización

Usa `LocalizationPort` en los límites de la aplicación y de las vistas cuando quien llama necesita un
objeto localizado en lugar de un runtime concreto:

```ts
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
} from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
const localization = createRuntimeLocalizationPort(runtime);

const title = localization.resolve({
  key: { namespace: 'app', id: 'title' },
});
```

`resolve()` devuelve un objeto localizado congelado con la clave, el locale, la dirección,
el tipo de entrada, el estado traducido/de respaldo/ausente, el valor, las incidencias y los hechos. Así
el código de renderizado se mantiene al margen de la carga de catálogos, las rutas del sistema de archivos, los datos CSV y
los detalles de mutación del runtime, a la vez que se conserva suficiente estado para las herramientas y los modos
inferiores.

## Cargas de recursos y datos

Las entradas de mensaje se resuelven como cadenas. Las entradas `resource` y `data` se resuelven como
valores estructurados portables, y el runtime congela esos valores antes de entregarlos
a quien llama.

Mantén las cargas de recursos y datos con forma JSON:

- cadenas, números, booleanos, null y undefined
- arrays solo con entradas indexadas
- objetos simples solo con propiedades de datos enumerables

No uses:

- instancias de clases ni objetos integrados como `Date`
- propiedades con claves de tipo symbol
- propiedades no enumerables
- propiedades de acceso
- grafos de objetos cíclicos
- funciones, symbols ni valores bigint

Las formas no admitidas se rechazan en el límite de localización en lugar de
normalizarse en silencio. Así se mantienen honestos los catálogos generados, los adaptadores del cargador del runtime y
el código de las vistas: los adaptadores deben producir datos portables, y los consumidores pueden confiar
en que los valores localizados de recursos y datos son instantáneas inmutables y no manejadores
mutables del runtime.

Los adaptadores pueden comprobar las cargas antes de construir los catálogos:

```ts
import { isJsonShapedLocalizedValue } from '@flyingrobots/bijou-i18n';

if (!isJsonShapedLocalizedValue(payload)) {
  throw new Error('i18n resource/data payload must be JSON-shaped');
}
```

Las cargas válidas de recursos y datos son datos densos y simples:

```ts
const validResource = {
  label: 'Counter',
  range: { min: 0, max: 10 },
  marks: ['empty', 'half', 'full'],
};
```

Las cargas no válidas se rechazan en lugar de normalizarse en silencio:

```ts
class CounterResource {
  readonly label = 'Counter';
}

const sparse = new Array<string>(2);
sparse[1] = 'full';

const accessor = Object.defineProperty({}, 'label', {
  enumerable: true,
  get() {
    return 'Counter';
  },
});

isJsonShapedLocalizedValue(new CounterResource()); // false
isJsonShapedLocalizedValue(sparse); // false
isJsonShapedLocalizedValue(accessor); // false
```

## Documentación

Consulta el [repositorio de Bijou](https://github.com/flyingrobots/bijou) para ver el mapa completo de la documentación, la guía de arquitectura y el sistema de diseño.
