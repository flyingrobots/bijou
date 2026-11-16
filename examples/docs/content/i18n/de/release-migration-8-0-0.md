---
title: "Migrationsleitfaden v8.0.0"
summary: "Migrationshinweise für das Upgrade auf 8.0.0."
---
# Migration auf Bijou 8.0.0-rc.1

Dies ist ein Release Candidate. Pinne die exakte Version; verwende keinen Caret-Bereich.

```bash
npm install @flyingrobots/bijou@8.0.0-rc.1 \
            @flyingrobots/bijou-node@8.0.0-rc.1 \
            @flyingrobots/bijou-tui@8.0.0-rc.1
```

Alle Workspace-Pakete werden im Gleichschritt versioniert, daher wird das Mischen von `8.0.0-rc.1`- mit
`7.2.0`-Paketen nicht unterstützt.

Zwei Breaking Changes, beide aus
[`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md). Keine davon erfordert
bei den meisten Anwendungen eine Codeänderung; beide ändern, was deine Anwendung in
Situationen *tut*, die du womöglich nicht getestet hast.

## 1. `NO_COLOR` erzwingt nicht mehr den Modus `'pipe'`

### Was sich geändert hat

`detectOutputMode()` prüft `NO_COLOR` nicht mehr. Die Erkennungsreihenfolge lautet jetzt:

```text
BIJOU_ACCESSIBLE=1  -> 'accessible'
TERM=dumb           -> 'pipe'
!stdout.isTTY       -> 'pipe'
CI                  -> 'static'
stdout.isTTY        -> 'interactive'
```

### Warum

`NO_COLOR` ist eine Aussage über Farbe. [no-color.org](https://no-color.org)
legt fest, dass seine Anwesenheit „das Hinzufügen von ANSI-Farbe verhindert“, und sagt
nichts über Cursor-Adressierung oder Interaktivität. Die Zuordnung zu `'pipe'` bedeutete, dass
jemand, der `NO_COLOR=1` in einem Shell-Profil exportiert hatte – verbreitet und vernünftig –,
die gesamte TUI verlor statt nur ihrer Farbe: Jede Komponente wurde auf ihre
Einzelbild-Form herabgestuft, und `shouldUseShellQuitConfirm()` lieferte plötzlich
`'immediate'`.

### Was sich *nicht* geändert hat

Die Farbausgabe. `NO_COLOR` wird unabhängig davon von `createBijou()`,
`createNodeContext()` und `isNoColor()` gelesen, von denen keine den Modus abfragt. Mit
gesetztem `NO_COLOR` erhältst du weiterhin `theme.noColor === true`, `ink()` liefert
`undefined`, und `styled()` liefert ungestylten Text.

Um den Geltungsbereich genau zu fassen: Eine interaktive Sitzung gibt sehr wohl Cursorbewegungen,
Bildschirmaktualisierungen und eventuell Alternate-Screen-Sequenzen aus – das muss sie, sonst ist sie
keine TUI. Was `NO_COLOR` unterdrückt, sind **Farb- und Stil-Escapes**, und genau das
verlangt es.

### Was du eventuell tun musst

**Wenn du dich auf `NO_COLOR` verlassen hast, um Einzelbild-Ausgabe zu erhalten**, etwa in einem Skript oder
einem Harness, das Logs mitschneidet, funktioniert das nicht mehr. Verwende, was zutrifft:

```ts
// The terminal genuinely cannot do cursor addressing:
TERM=dumb

// You are capturing output rather than driving a terminal:
//   redirect stdout — a non-TTY stdout still yields 'pipe'

// You want to force it from inside the app:
const ctx = { ...createBijou(ports), mode: 'pipe' as const };
```

**Wenn du `NO_COLOR` gesetzt hast, weil du eine monochrome TUI wolltest**, bekommst du jetzt eine.
Nichts zu tun; genau das ist die Korrektur.

**Wenn du einen eigenen Detektor geschrieben hast, um das zu umgehen** – `git-cas` und `muniment`
haben das beide getan –, kannst du ihn löschen. Prüfe, dass deine Überschreibung nicht auch
etwas anderes kodiert, das du weiterhin willst.

## 2. Ein unbekannter Statusschlüssel wird nicht mehr zu einem durchgestrichenen Token aufgelöst

### Was sich am Fallback geändert hat

`ctx.status(key)` und `ResolvedTheme.inkStatus(key)` fallen auf
`semantic.muted` statt auf `status.muted` zurück, wenn `key` nicht im Theme enthalten ist.

### Warum der Fallback verschoben wurde

`status.muted` trägt in jedem mitgelieferten Preset `['dim', 'strikethrough']`. Das
ist sinnvoll für ein Token mit der Bedeutung „ausgemustert“ – und falsch als Antwort auf „Ich kenne
diesen Schlüssel nicht“. Weil `status(key)` einen `string` akzeptiert, wurde bei einem Tippfehler oder einem Schlüssel,
den eine Anwendung vergessen hatte, ihrem Theme hinzuzufügen, stillschweigend durchgestrichener Text
gerendert. Lesende sehen „abgebrochen“; die Anwendung hat nichts dergleichen gesagt.

Das neue Ziel entspricht dem Geschwister-Accessor `ui()`, der bereits auf
`semantic.primary` zurückfällt.

### Was du wegen des Fallbacks eventuell tun musst

**Wahrscheinlich nichts.** `status.muted` und `semantic.muted` teilen sich in jedem
mitgelieferten Preset denselben Hex-Wert, daher ist der einzige sichtbare Unterschied das Fehlen der
Durchstreichung.

**Wenn du ein Theme definiert hast, in dem diese beiden Tokens unterschiedliche Hex-Werte haben**, wird ein
unbekannter Schlüssel jetzt zum Hex-Wert von `semantic.muted` aufgelöst. Prüfe alle eigenen Presets.

**Wenn du dich auf den durchgestrichenen Fallback verlassen hast**, um während der Entwicklung undefinierte
Schlüssel zu erkennen: Er ist weg. Er war nie ein verlässliches Signal – er erschien nur,
wenn ein Codepfad tatsächlich ausgeführt wurde.
[#521](https://github.com/flyingrobots/bijou/issues/521) verfolgt die Typisierung der
Accessoren, damit ein fehlender Schlüssel stattdessen zu einem Compilerfehler wird.

`ctx.status('muted')` selbst ist unverändert, die Durchstreichung bleibt erhalten.

## 3. Ergänzung: `extendTheme()` erreicht alle sechs Token-Gruppen

Kein Breaking Change. `border` und `semantic` kommen zu `status`, `ui`, `gradient` und
`surface` hinzu:

```ts
const theme = extendTheme(BIJOU_DARK, {
  status: { guarded: tv('#4cc9c3') },
  border: { primary: tv('#75798d') },     // now possible
  semantic: { accent: tv('#d6c5ff') },    // now possible
});
```

Beide lassen sich überschreiben, aber nicht um neue Schlüssel erweitern, weil `Theme`
ihre Schlüsselmengen festlegt.

### Warum das wichtiger ist, als es aussieht

Die mitgelieferten Presets verwenden über Gruppen hinweg stark dieselben Werte. `bijou-dark` nutzt `#f2c45d` für
`status.warning`, `status.active`, `semantic.warning`, `semantic.accent`,
`ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`, `border.secondary`
**und** `border.warning` – zehn Tokens, eine Farbe. `bijou-light` macht dasselbe
mit `#7a5200`.

`extendTheme(BIJOU_DARK, { status })` hat also deine Statuswerte ersetzt und stillschweigend
dieses Bernstein für jede Überschrift, jeden Cursor und jeden Rahmen beibehalten. Wenn du das getan hast, haben deine
Überschriften wahrscheinlich dieselbe Farbe wie dein `warning`. Das ist nicht hypothetisch
– so wurde es entdeckt, bei ΔE 0.023 in OKLab, was nicht unterscheidbar ist.

Wenn du `status` überschreibst, solltest du auch `ui` und `border` prüfen:

```ts
import { doctorTheme } from '@flyingrobots/bijou';
console.log(doctorTheme(myTheme, { maxColorReuse: 2 }));
```

Beachte, dass `doctorTheme` Kontrast und Wiederverwendung prüft, nicht aber die wahrnehmbare Unterscheidbarkeit
bei Farbsehschwächen – siehe
[#520](https://github.com/flyingrobots/bijou/issues/520) –, und dass die mitgelieferten
Presets diese derzeit nicht erfüllen
([#519](https://github.com/flyingrobots/bijou/issues/519)).

## Feedback zum RC melden

Dieser Kandidat existiert, um herauszufinden, was diese beiden Änderungen in realen
Anwendungen kaputt machen. Bitte melde dich unter
[#518](https://github.com/flyingrobots/bijou/issues/518) oder eröffne ein neues Issue mit
dem Label `lane:release`.
