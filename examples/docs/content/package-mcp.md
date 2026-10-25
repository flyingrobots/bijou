---
dogfood:
  localization:
    sourceLocale: en
    locales: [de, es, fr]
    localized:
      de: ./package-mcp.de.md
      es: ./package-mcp.es.md
      fr: ./package-mcp.fr.md
---

# @flyingrobots/bijou-mcp

The MCP server exposes Bijou components as rendering tools over stdio. It is
an adapter for MCP clients, separate from the fullscreen DOGFOOD application.

```sh
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

Configure your MCP client to run `node` with
`node_modules/@flyingrobots/bijou-mcp/bin/bijou-mcp.js` as its argument.
Tools include `bijou_table`, `bijou_tree`, `bijou_dag`, `bijou_box`,
`bijou_progress_bar`, navigation/status panels, and `bijou_docs` for the
machine-readable component field guide.

Every tool accepts `output`: `text` returns rendered content, `data` returns
MCP `structuredContent`, and `both` returns both. Choose semantic data when a
consumer needs values rather than terminal artwork.

The server uses interactive component layout with a plain style adapter.
`bijou_hyperlink` separately selects its plain-text fallback instead of OSC 8
controls. The default `fallback: "both"` returns `text (url)`; `text` returns
the label and `url` returns the target. This also applies to
`structuredContent.rendered`; semantic data retains the original text and URL.

See `packages/bijou-mcp/README.md` for client configuration and the full tool
list. Check the running package and tracker before treating an open fix as shipped.
