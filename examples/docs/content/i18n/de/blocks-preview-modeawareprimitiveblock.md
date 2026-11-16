---
title: "  ModeAwarePrimitiveBlock"
summary: "Erfasst die Ausgabe eigener Primitive mit expliziten Modusverträgen und Fakt-/Wert-Semantik."
---
Erfasst die Ausgabe eigener Primitive mit expliziten Modusverträgen und Fakt-/Wert-Semantik.
Familie: primitive
Maßstab: section
Modi: interactive, static, pipe, accessible
Slots: primitive erforderlich, fact erforderlich, value erforderlich, status optional, modeContract optional, selected optional
Varianten: ready (Bereit)
Datenanforderungen: primitive
Befehlsabsichten: modeAwarePrimitive.select, modeAwarePrimitive.copyFacts, modeAwarePrimitive.openStory
Stories: mode-aware-primitive.ready (ready)
