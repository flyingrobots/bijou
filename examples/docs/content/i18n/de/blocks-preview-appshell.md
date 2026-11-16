---
title: "  AppShell"
summary: "Setzt logische App-Bereiche für Navigation, Inhalt, Inspektion, Status und Overlays zusammen."
---
Setzt logische App-Bereiche für Navigation, Inhalt, Inspektion, Status und Overlays zusammen.
Familie: app-structure
Maßstab: app
Modi: interactive, static, pipe, accessible
Slots: navigation optional, content erforderlich, inspector optional, status optional, overlays optional
Varianten: wide (Breit), narrow (Schmal)
Datenanforderungen: -
Befehls-Intents: shell.focusRegion, shell.toggleInspector, shell.openOverlay
Stories: app-shell.ready (bereit), app-shell.narrow (schmal), app-shell.overlay (Overlay)
