---
title: "JavaScript de estilo sistema"
summary: "La verdad del runtime, los límites, los adaptadores, los códecs y la doctrina de infraestructura de todo el repositorio."
---

# JavaScript de estilo sistema

_Cómo escribir infraestructura en JavaScript que perdure._

Esta es una doctrina de ingeniería para todo el repositorio de Bijou y otras
bases de código de `flyingrobots`. No es una guía de estilo de formato. Es una
doctrina para escribir infraestructura que siga siendo honesta durante la ejecución,
la reproducción, la migración, la depuración, la replicación, los fallos y el paso del tiempo.

## Adaptación a Bijou

Bijou está implementado actualmente en gran parte en TypeScript. Eso no
debilita esta doctrina. Afina cómo debe usarse TypeScript aquí.

En este repositorio:

- TypeScript es un dialecto útil, no la autoridad final
- el modelado respaldado por el runtime prevalece sobre la confianza basada solo en tipos
- el análisis en los límites, los adaptadores explícitos y las pruebas prevalecen sobre la comodidad del editor
- las afirmaciones rotundas sobre la arquitectura deben anclarse en código de runtime,
  invariantes y pruebas ejecutables

Por tanto, esta doctrina **no** significa «reescribir Bijou en `.js`
puro mañana». Significa que Bijou debe tratar la verdad del runtime como
autoridad arquitectónica incluso cuando el lenguaje de implementación sea
TypeScript.

## Regla 0: la verdad del runtime gana

Cuando el programa se está ejecutando, hay una pregunta que importa por encima de todas:

**¿Qué es realmente cierto ahora mismo, en memoria, durante la ejecución?**

Si la respuesta depende de comentarios, convenciones, tipos que desaparecen, ilusiones
o sensaciones del editor, el código está mintiendo.

Los valores de dominio de confianza deben crearse mediante construcción en runtime,
análisis o validación que establezca sus invariantes. Una vez
establecidas, esas invariantes deben preservarse mientras el valor
siga siendo de confianza.

Esta regla prevalece sobre la documentación, los pasos de compilación, las pistas del editor, las
capas estáticas, las herramientas de tiempo de compilación, el folclore del equipo y el «pero el linter decía
que estaba bien».

## Qué significa esto en la práctica

La infraestructura no puede permitirse contratos falsos:

- un tipo que desaparece en runtime no es un contrato con autoridad
- un comentario que describe una forma no es un contrato con autoridad
- un objeto simple que «debería» tener campos válidos no es un contrato
  con autoridad
- un tooltip del IDE no es un contrato con autoridad
- un paso de compilación no es un contrato con autoridad

Estas herramientas pueden ser útiles. Ninguna prevalece sobre el runtime.

## Por qué importa aquí

Bijou no es solo pegamento de vistas. El repositorio abarca:

- estado del runtime y flujo de eventos
- límites del host y adaptadores
- pruebas deterministas y reproducibilidad
- catálogos de localización y formatos de intercambio
- API públicas de larga vida
- comportamiento del shell que debe seguir siendo explicable tanto para personas como para
  agentes

Aquí, las suposiciones difusas se convierten en errores con vidas medias largas.

## La jerarquía de la verdad

Cuando las capas discrepan, la autoridad fluye en este orden:

1. **Modelo de dominio en runtime**: constructores, invariantes, métodos, tipos
   de error
2. **Esquemas y analizadores de los límites**: Zod, decodificadores, validadores de protocolo
3. **Pruebas**: la especificación ejecutable
4. **JSDoc y documentos de diseño**: explicaciones para personas del modelo
   de runtime
5. **IDE y herramientas estáticas**: navegación, ayuda a la refactorización
6. **TypeScript**: dialecto útil, no autoridad final

## Alcance

Este estándar está optimizado para:

- código de infraestructura con invariantes sólidas
- sistemas de larga vida con límites explícitos
- flujos de ejecución directa portables entre hosts
- núcleos capaces de ejecutarse en el navegador
- repositorios JavaScript primero o con TypeScript como dialecto
- código que debe poder enseñarse, leerse y publicarse

No pretende afirmar que todo proyecto JavaScript deba tener este aspecto.
**Sí** afirma que, para esta familia de repositorios, el modelado de dominio
respaldado por el runtime supera a la confianza blanda en las formas.

## Política de lenguajes

### JavaScript primero, TypeScript subordinado

JavaScript sigue siendo el lenguaje conceptual de base de esta doctrina:

- rápido de escribir y de cambiar
- de ejecución directa
- portable
- lo bastante expresivo para infraestructura seria
- lo bastante legible para enseñar con él

Bijou usa actualmente TypeScript de forma intensiva, pero la regla es la misma:
TypeScript puede mejorar la refactorización, el soporte del editor y la ergonomía
para los consumidores. **No** sustituye la validación en runtime, no preserva
invariantes por sí solo ni justifica un modelado débil.

Usa TypeScript donde ayude. Nunca lo confundas con la fuente de
la verdad.

### Vía de escape: Rust mediante WebAssembly

Cuando JavaScript no basta para trabajo intensivo de CPU, análisis de binarios
hostiles, núcleos criptográficos o bucles críticos sensibles a la memoria, usa Rust.

Reparto preferido:

| Capa | Lenguaje | Función |
|------|------|------|
| Lógica de dominio del núcleo | JavaScript / TypeScript con modelado respaldado por el runtime | Predeterminada, portable, capaz de ejecutarse en el navegador |
| Núcleos críticos para el rendimiento | Rust -> Wasm | Seguridad y velocidad donde esté justificado |
| Adaptadores del host | JavaScript / TypeScript | Límites de Node, navegador y workers |
| Orquestación | JavaScript / TypeScript | Pegamento entre núcleos y hosts |

## Arquitectura

### Portabilidad con el navegador primero

El navegador es la plataforma de despliegue más universal y la prueba definitiva
de portabilidad. La lógica del núcleo debe preferir primitivas compatibles
con la plataforma web.

```javascript
// Portable
const bytes = new TextEncoder().encode(text);
const arr = new Uint8Array(buffer);
const url = new URL(path, base);

// Node-only; belongs in adapters
const buf = Buffer.from(text, 'utf8');
const resolved = require('path').resolve(p);
```

### La arquitectura hexagonal es obligatoria

La lógica de dominio del núcleo no debe depender directamente de globales de Node, API del sistema
de archivos, `process`, `Buffer` ni llamadas específicas del host. Todo eso va detrás de
puertos de adaptadores.

**Regla del núcleo:** la lógica del núcleo no debería saber que Node existe.

En términos de Bijou:

- `@flyingrobots/bijou` define puertos y utilidades puras
- `@flyingrobots/bijou-node` es responsable de la integración con Node
- las costuras del runtime, la i18n y las herramientas deben seguir siendo explícitas en lugar de
  filtrar suposiciones del host hacia dentro

## Modelo de objetos

JavaScript de estilo sistema organiza el código en torno a objetos respaldados por el runtime:

- **Objetos de valor** para valores con significado e invariantes
- **Entidades** para la identidad y el ciclo de vida
- **Resultados** como objetos despachables en runtime, no bolsas blandas
  etiquetadas
- **Errores** como fallos de dominio de primera clase, no análisis de mensajes
  basado en cadenas

Las clases suelen ser una buena herramienta aquí, pero la regla real es más fuerte que
«usa clases»: los conceptos importantes necesitan formas respaldadas por el runtime con
invariantes preservadas.

## Principios

### P1: los conceptos de dominio requieren formas respaldadas por el runtime

Si un concepto tiene invariantes, identidad o comportamiento, necesita una
representación respaldada por el runtime. Un typedef o un objeto simple no basta.

### P2: la validación ocurre en los límites y en los puntos de construcción

La entrada no fiable solo se convierte en datos de confianza mediante constructores o
métodos de análisis dedicados. Los constructores establecen invariantes y no
realizan E/S.

### P3: el comportamiento pertenece al tipo que lo posee

Evita hacer switch sobre etiquetas `kind` o `type` cuando el despacho en runtime sirva.
Pon el comportamiento en el tipo propietario.

### P4: los esquemas van en los límites, no en el núcleo

Usa esquemas para rechazar la entrada mal formada en el borde. Los tipos de dominio poseen
el comportamiento y las invariantes dentro del límite.

### P5: la serialización es problema del códec

La capa de bytes se mantiene separada de la capa de significado. Los tipos de dominio no
necesitan saber cómo se codifican.

### P6: una única fuente de verdad

No dupliques el mismo contrato entre JSDoc, TypeScript y
validadores. Define primero el modelo de runtime. Todo lo demás se deriva de él
o lo documenta.

### P7: despacho en runtime en lugar de switch sobre etiquetas

Dentro de un runtime coherente, `instanceof` suele ser correcto. Cuando los valores
cruzan realms o límites de módulos duplicados, usa marcas en lugar de
fingir que la identidad nominal sigue siendo válida.

## Prácticas

- **`any` está desterrado; `unknown` está en cuarentena**: `unknown` solo se permite
  en los bordes en bruto y debe eliminarse inmediatamente mediante análisis
- **los valores de confianza deben preservar su integridad**: usa `Object.freeze()`,
  estado privado o copias defensivas donde haga falta
- **el tipo de error es lo principal; los códigos son metadatos opcionales**: nunca ramifiques
  según `err.message`
- **los objetos de parámetros deben aportar valor semántico**: no conviertas el lodo
  de opciones en norma del diseño de la API pública
- **los objetos en bruto pueden llevar bytes, no significado**: los objetos simples son para
  cargas decodificadas o registros, no para semántica de dominio de confianza
- **los números y cadenas mágicos están desterrados**: da nombres reales a las
  constantes semánticas
- **los parámetros booleanos trampa están desterrados**: prefiere políticas con nombre o
  métodos separados
- **los datos estructurados siguen siendo estructurados**: no obligues a las máquinas a analizar prosa
  para recuperar datos
- **el ámbito del módulo es el primer límite de privacidad**: si no se exporta,
  es privado
- **JSDoc documenta el modelo de runtime; no lo sustituye**

## Disciplina de herramientas

**El lint es ley.**

- los errores de lint hacen fallar la CI
- las supresiones requieren un motivo documentado
- la aplicación más estricta debe recaer en las coerciones inseguras, las promesas
  flotantes, el uso de `Error` en bruto y la filtración de código específico del host al núcleo

Cuando se usa TypeScript:

- sigue subordinado a la validación en runtime
- no debe sustituir al modelado de dominio
- `any` está prohibido
- `unknown` solo tiene cabida en los bordes en bruto y debe desaparecer rápidamente

## La doctrina contra la sopa de formas

La mayor parte de la mala infraestructura nace de un modelado débil. La disciplina es:

1. nombrar el concepto
2. construir el concepto con invariantes validadas
3. proteger la invariante
4. asociar el comportamiento al tipo propietario
5. proteger el límite con esquemas y analizadores
6. separar el códec del dominio
7. aislar el host detrás de adaptadores
8. documentar el runtime que existe de verdad
9. probar la verdad

## Lista de comprobación de revisión

Antes de fusionar, pregúntate:

- ¿es este un concepto de dominio real, y dónde está su forma respaldada por el runtime?
- ¿dónde se elimina `unknown`?
- ¿la construcción establece la confianza?
- ¿el comportamiento vive en el tipo que lo posee?
- ¿hay alguien analizando `err.message` como un mapache en un contenedor de basura?
- ¿hay números o cadenas mágicos?
- ¿podría esta lógica ejecutarse en un núcleo capaz de funcionar en el navegador?
- ¿se está confundiendo la ficción de las herramientas con arquitectura?

## Invariantes derivadas

Esta doctrina se refleja en estas invariantes del repositorio:

- [La verdad del runtime gana](./invariants/runtime-truth-wins.md)
- [Los esquemas viven en los límites](./invariants/schemas-live-at-boundaries.md)
- [Las API del host se quedan detrás de adaptadores](./invariants/host-apis-stay-behind-adapters.md)
- [Los códecs no son modelos de dominio](./invariants/codecs-are-not-domain-models.md)
- [Las pruebas son la especificación](./invariants/tests-are-the-spec.md)

Esto es infraestructura. El código no puede depender de disfraces ni fingir que
los comentarios son contratos. La verdad del runtime vence a la certeza fantasma
siempre.
