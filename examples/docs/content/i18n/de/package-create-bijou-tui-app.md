---
summary: "Der Scaffolder zum Aufsetzen eines lauffähigen Bijou-TUI-App-Projekts."
---

# `create-bijou-tui-app`

Erzeuge eine neue Bijou-TUI-App mit Standardeinstellungen, bei denen alles Nötige dabei ist.

## Rolle des Pakets

- **Kanonischer Starter** — generierte Apps zielen auf den aktuellen Pfad `@flyingrobots/bijou-tui` + `@flyingrobots/bijou-tui-app` statt auf einen älteren Shell-Starter-Pfad.
- **Nur öffentliche API** — die erzeugte App nutzt öffentliche Paket-APIs, damit sie als nachgelagerter Kanarienvogel für reale Upgrades dienen kann.
- **Release-konforme Standards** — das generierte Projekt folgt derselben Aufteilung in Shell und Laufzeit, die in der Root-Dokumentation und im Migrationsleitfaden beschrieben ist.

## Verwendung

```sh
npm create bijou-tui-app@latest my-app
cd my-app
npm run dev
```

Die generierte App lässt sich auch direkt ausführen mit:

```sh
npx tsx src/main.ts
```

## Was erzeugt wird

- TypeScript-Node-App-Einstiegspunkt mit `createTuiAppSkeleton()`
- Laufzeitstart mit Mausunterstützung (`run(..., { mouse: true })`)
- Abhängigkeiten:
  - `@flyingrobots/bijou`
  - `@flyingrobots/bijou-node`
  - `@flyingrobots/bijou-tui`
  - `@flyingrobots/bijou-tui-app`
- Starter-Skripte: `dev`, `build`, `start`
- Strikte `tsconfig.json`
- Eine README, die die Shell-Muster erklärt, die der Starter modelliert
