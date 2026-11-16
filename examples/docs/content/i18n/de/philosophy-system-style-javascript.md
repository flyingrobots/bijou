---
title: "JavaScript im Systemstil"
summary: "Laufzeitwahrheit, Grenzen, Adapter, Codecs und die repoweite Infrastrukturdoktrin."
---
# JavaScript im Systemstil

_Wie du JavaScript-Infrastruktur schreibst, die Bestand hat._

Dies ist eine repoweite Engineering-Doktrin für Bijou und andere
`flyingrobots`-Codebasen. Sie ist kein Formatierungs-Styleguide. Sie ist
eine Doktrin für Infrastruktur, die ehrlich bleibt unter Ausführung,
Replay, Migration, Debugging, Replikation, Fehlern und der Zeit.

## Anpassung für Bijou

Bijou ist derzeit größtenteils in TypeScript implementiert. Das schwächt
diese Doktrin nicht ab. Es schärft, wie TypeScript hier eingesetzt werden soll.

In diesem Repo gilt:

- TypeScript ist ein nützlicher Dialekt, nicht die letzte Instanz
- laufzeitgestützte Modellierung steht über reinem Typvertrauen
- Parsing an Grenzen, explizite Adapter und Tests stehen über Editorkomfort
- starke Aussagen über die Architektur sollten in Laufzeitcode,
  Invarianten und ausführbaren Nachweisen verankert sein

Diese Doktrin bedeutet daher **nicht** „Bijou morgen in reines
`.js` umschreiben“. Sie bedeutet, dass Bijou Laufzeitwahrheit als
architektonische Autorität behandeln soll, auch wenn die
Implementierungssprache TypeScript ist.

## Regel 0: Laufzeitwahrheit gewinnt

Wenn das Programm läuft, zählt vor allem eine Frage:

**Was ist gerade jetzt tatsächlich wahr, im Speicher, während der Ausführung?**

Hängt die Antwort von Kommentaren, Konventionen, verschwundenen Typen,
Wunschdenken oder Editor-Gefühl ab, dann lügt der Code.

Vertrauenswürdige Domänenwerte müssen durch Konstruktion zur Laufzeit,
Parsing oder Validierung entstehen, die ihre Invarianten herstellt. Einmal
hergestellt, müssen diese Invarianten erhalten bleiben, solange der Wert
als vertrauenswürdig gilt.

Diese Regel steht über Dokumentation, Build-Schritten, Editor-Hinweisen,
statischen Overlays, Compile-Zeit-Werkzeugen, Teamfolklore und „aber der
Linter hat gesagt, es ist in Ordnung“.

## Was das in der Praxis bedeutet

Infrastruktur kann sich keine falschen Verträge leisten:

- ein Typ, der zur Laufzeit verschwindet, ist kein maßgeblicher Vertrag
- ein Kommentar, der eine Form beschreibt, ist kein maßgeblicher Vertrag
- ein einfaches Objekt, das gültige Felder haben „sollte“, ist kein
  maßgeblicher Vertrag
- ein IDE-Tooltip ist kein maßgeblicher Vertrag
- ein Compile-Schritt ist kein maßgeblicher Vertrag

Diese Werkzeuge können nützlich sein. Keines davon steht über der Laufzeit.

## Warum es hier wichtig ist

Bijou ist nicht bloß View-Kleber. Das Repo berührt:

- Laufzeitzustand und Ereignisfluss
- Host-Grenzen und Adapter
- deterministische Tests und Wiederabspielbarkeit
- Lokalisierungskataloge und Austauschformate
- langlebige öffentliche APIs
- Shell-Verhalten, das für Menschen und Agenten gleichermaßen
  erklärbar bleiben muss

Schwammige Annahmen werden hier zu Fehlern mit langer Halbwertszeit.

## Die Hierarchie der Wahrheit

Wenn Schichten sich widersprechen, fließt die Autorität in dieser Reihenfolge:

1. **Laufzeit-Domänenmodell**: Konstruktoren, Invarianten, Methoden,
   Fehlertypen
2. **Grenzschemas und Parser**: Zod, Decoder, Protokollvalidatoren
3. **Tests**: die ausführbare Spezifikation
4. **JSDoc und Designdokumente**: menschenlesbare Erklärungen des
   Laufzeitmodells
5. **IDE und statische Werkzeuge**: Navigation, Refactoring-Unterstützung
6. **TypeScript**: nützlicher Dialekt, nicht die letzte Instanz

## Geltungsbereich

Dieser Standard ist optimiert für:

- Infrastrukturcode mit starken Invarianten
- langlebige Systeme mit expliziten Grenzen
- direkte Ausführungsabläufe, die zwischen Hosts portierbar sind
- browserfähige Kerne
- JavaScript-first- oder TypeScript-als-Dialekt-Repositorys
- Code, der lehrbar, lesbar und veröffentlichbar sein muss

Er behauptet nicht, dass jedes JavaScript-Projekt so aussehen sollte.
Er behauptet **sehr wohl**, dass für diese Familie von Repositorys
laufzeitgestützte Domänenmodellierung weiches Formvertrauen schlägt.

## Sprachrichtlinie

### JavaScript zuerst, TypeScript untergeordnet

JavaScript bleibt die konzeptionelle Basissprache dieser Doktrin:

- schnell zu schreiben und zu ändern
- direkt ausführbar
- portabel
- ausdrucksstark genug für ernsthafte Infrastruktur
- lesbar genug, um daraus zu lehren

Bijou nutzt derzeit stark TypeScript, aber die Regel ist dieselbe:
TypeScript kann Refactoring, Editorunterstützung und Ergonomie für
Konsumenten verbessern. Es ersetzt **keine** Laufzeitvalidierung, erhält
Invarianten nicht von selbst und entschuldigt keine schwache Modellierung.

Setze TypeScript dort ein, wo es hilft. Verwechsle es nie mit der Quelle
der Wahrheit.

### Notausgang: Rust über WebAssembly

Wenn JavaScript für enge CPU-Arbeit, feindseliges Binär-Parsing,
kryptografische Kernel oder speichersensible Hot Loops nicht ausreicht,
nutze Rust.

Bevorzugte Aufteilung:

| Schicht | Sprache | Rolle |
|------|------|------|
| Kern-Domänenlogik | JavaScript / TypeScript mit laufzeitgestützter Modellierung | Standard, portabel, browserfähig |
| Performancekritische Kernel | Rust -> Wasm | Sicherheit und Geschwindigkeit, wo gerechtfertigt |
| Host-Adapter | JavaScript / TypeScript | Node-, Browser-, Worker-Grenzen |
| Orchestrierung | JavaScript / TypeScript | Kleber zwischen Kernen und Hosts |

## Architektur

### Browser-first-Portabilität

Der Browser ist die universellste Bereitstellungsplattform und der
ultimative Portabilitätstest. Kernlogik sollte webplattformfreundliche
Primitive bevorzugen.

```javascript
// Portable
const bytes = new TextEncoder().encode(text);
const arr = new Uint8Array(buffer);
const url = new URL(path, base);

// Node-only; belongs in adapters
const buf = Buffer.from(text, 'utf8');
const resolved = require('path').resolve(p);
```

### Hexagonale Architektur ist Pflicht

Kern-Domänenlogik darf nicht direkt von Node-Globals, Dateisystem-APIs,
`process`, `Buffer` oder hostspezifischen Aufrufen abhängen. Diese gehören
hinter Adapter-Ports.

**Kernregel:** Kernlogik sollte nicht wissen, dass Node existiert.

In Bijou-Begriffen:

- `@flyingrobots/bijou` definiert Ports und reine Hilfsfunktionen
- `@flyingrobots/bijou-node` verantwortet die Node-Integration
- Laufzeit-, i18n- und Tooling-Nahtstellen sollten explizit bleiben,
  statt Host-Annahmen nach innen durchsickern zu lassen

## Objektmodell

JavaScript im Systemstil organisiert Code um laufzeitgestützte Objekte:

- **Wertobjekte** für bedeutungstragende Werte mit Invarianten
- **Entitäten** für Identität und Lebenszyklus
- **Ergebnisse / Ausgänge** als zur Laufzeit dispatchbare Objekte, nicht
  als weiche getaggte Beutel
- **Fehler** als erstklassige Domänenfehlschläge, nicht als stringbasiertes
  Parsen von Meldungen

Klassen sind hier oft ein gutes Werkzeug, aber die eigentliche Regel ist
stärker als „nutze Klassen“: Wichtige Konzepte brauchen laufzeitgestützte
Formen mit erhaltenen Invarianten.

## Prinzipien

### P1: Domänenkonzepte brauchen laufzeitgestützte Formen

Hat ein Konzept Invarianten, Identität oder Verhalten, braucht es eine
laufzeitgestützte Repräsentation. Ein Typedef oder einfaches Objekt reicht nicht.

### P2: Validierung geschieht an Grenzen und Konstruktionspunkten

Nicht vertrauenswürdige Eingaben werden nur durch Konstruktoren oder
dedizierte Parse-Methoden zu vertrauenswürdigen Daten. Konstruktoren stellen
Invarianten her und führen kein I/O aus.

### P3: Verhalten gehört zu dem Typ, dem es gehört

Vermeide Switches über `kind`- oder `type`-Tags, wenn Laufzeit-Dispatch
genügt. Lege Verhalten auf den besitzenden Typ.

### P4: Schemas gehören an Grenzen, nicht in den Kern

Nutze Schemas, um fehlerhafte Eingaben am Rand abzuweisen. Innerhalb der
Grenze besitzen Domänentypen Verhalten und Invarianten.

### P5: Serialisierung ist Sache des Codecs

Die Byte-Schicht bleibt von der Bedeutungsschicht getrennt. Domänentypen
müssen nicht wissen, wie sie kodiert werden.

### P6: Eine einzige Quelle der Wahrheit

Dupliziere denselben Vertrag nicht über JSDoc, TypeScript und Validatoren.
Definiere zuerst das Laufzeitmodell. Alles andere leitet sich davon ab oder
dokumentiert es.

### P7: Laufzeit-Dispatch statt Tag-Switching

Innerhalb einer kohärenten Laufzeit ist `instanceof` oft korrekt. Wenn Werte
Realms oder duplizierte Modulgrenzen überqueren, nutze Branding, statt so zu
tun, als gelte nominale Identität noch.

## Praktiken

- **`any` ist verbannt; `unknown` steht unter Quarantäne**: `unknown` ist
  nur an rohen Rändern erlaubt und sollte sofort durch Parsing beseitigt werden
- **vertrauenswürdige Werte müssen ihre Integrität bewahren**: nutze
  `Object.freeze()`, privaten Zustand oder defensives Kopieren, wo nötig
- **der Fehlertyp ist primär; Codes sind optionale Metadaten**: verzweige nie
  anhand von `err.message`
- **Parameterobjekte müssen semantischen Wert hinzufügen**: mache
  Optionsschlamm nicht zum Normalfall im öffentlichen API-Design
- **rohe Objekte dürfen Bytes tragen, keine Bedeutung**: einfache Objekte
  sind für dekodierte Payloads oder Logging da, nicht für vertrauenswürdige
  Domänensemantik
- **magische Zahlen und Strings sind verbannt**: gib semantischen Konstanten
  echte Namen
- **Boolean-Fallen-Parameter sind verbannt**: bevorzuge benannte Richtlinien
  oder getrennte Methoden
- **strukturierte Daten bleiben strukturiert**: zwinge Maschinen nicht, Prosa
  zu parsen, um Daten zurückzugewinnen
- **der Modul-Scope ist die erste Privatsphäregrenze**: was nicht exportiert
  ist, ist privat
- **JSDoc dokumentiert das Laufzeitmodell; es ersetzt es nicht**

## Werkzeugdisziplin

**Lint ist Gesetz.**

- Lint-Fehler lassen CI fehlschlagen
- Unterdrückungen erfordern eine dokumentierte Begründung
- die härteste Durchsetzung sollte unsichere Typumwandlung, schwebende
  Promises, rohe `Error`-Verwendung und hostspezifisches Durchsickern in
  Kerncode treffen

Wenn TypeScript verwendet wird:

- bleibt es der Laufzeitvalidierung untergeordnet
- darf es Domänenmodellierung nicht ersetzen
- ist `any` verboten
- gehört `unknown` nur an rohe Ränder und sollte schnell verschwinden

## Die Anti-Formsuppe-Doktrin

Die meiste schlechte Infrastruktur entsteht aus schwacher Modellierung. Die
Disziplin lautet:

1. benenne das Konzept
2. konstruiere das Konzept mit validierten Invarianten
3. schütze die Invariante
4. hänge das Verhalten an den besitzenden Typ
5. sichere die Grenze mit Schemas und Parsern
6. trenne den Codec von der Domäne
7. isoliere den Host hinter Adaptern
8. dokumentiere die Laufzeit, die tatsächlich existiert
9. teste die Wahrheit

## Review-Checkliste

Frage vor dem Mergen:

- ist das ein echtes Domänenkonzept, und wo ist seine laufzeitgestützte Form?
- wo wird `unknown` beseitigt?
- stellt die Konstruktion Vertrauen her?
- lebt das Verhalten auf dem Typ, dem es gehört?
- parst jemand `err.message` wie ein Waschbär im Müllcontainer?
- gibt es magische Zahlen oder Strings?
- könnte diese Logik in einem browserfähigen Kern laufen?
- wird Werkzeugfiktion mit Architektur verwechselt?

## Abgeleitete Invarianten

Diese Doktrin spiegelt sich in diesen Repo-Invarianten wider:

- [Laufzeitwahrheit gewinnt](./invariants/runtime-truth-wins.md)
- [Schemas leben an Grenzen](./invariants/schemas-live-at-boundaries.md)
- [Host-APIs bleiben hinter Adaptern](./invariants/host-apis-stay-behind-adapters.md)
- [Codecs sind keine Domänenmodelle](./invariants/codecs-are-not-domain-models.md)
- [Tests sind die Spezifikation](./invariants/tests-are-the-spec.md)

Das ist Infrastruktur. Code kann sich nicht auf Kostüme verlassen oder so
tun, als wären Kommentare Verträge. Laufzeitwahrheit schlägt jedes Mal
Phantomgewissheit.
