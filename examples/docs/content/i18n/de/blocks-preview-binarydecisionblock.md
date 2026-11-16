---
title: "  BinaryDecisionBlock"
summary: "Beschreibt eine Ja/Nein-Entscheidung mit gewählter Seite, Konsequenz, Bestätigung und Fakten zum Deaktivierungsgrund."
---
Beschreibt eine Ja/Nein-Entscheidung mit gewählter Seite, Konsequenz, Bestätigung und Fakten zum Deaktivierungsgrund.
Familie: input
Maßstab: section
Modi: interactive, static, pipe, accessible
Slots: label erforderlich, selected erforderlich, consequence erforderlich, confirmation optional, disabledReason optional
Varianten: ready (Bereit)
Datenanforderungen: decision
Befehlsabsichten: binaryDecision.select, binaryDecision.copyFacts, binaryDecision.openStory
Stories: binary-decision.ready (ready)
