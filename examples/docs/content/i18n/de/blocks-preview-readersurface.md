---
title: "  ReaderSurface"
summary: "Komponiert lesbaren Inhalt mit optionalem Navigations- und Gliederungskontext."
---
Komponiert lesbaren Inhalt mit optionalem Navigations- und Gliederungskontext.
Familie: content-reading
Maßstab: section
Modi: interactive, static, pipe, accessible
Slots: content erforderlich, navigation optional, outline optional
Varianten: article (Artikel), loading (Lädt)
Datenanforderungen: article, outline
Befehlsabsichten: reader.selectHeading, reader.openReference
Stories: reader-surface.ready (ready), reader-surface.loading (loading), reader-surface.stale (stale), reader-surface.empty (empty), reader-surface.error (error)
