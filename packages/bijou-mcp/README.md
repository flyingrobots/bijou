# @flyingrobots/bijou-mcp

MCP (Model Context Protocol) server that exposes Bijou terminal
components as rendering tools over stdio.

Any MCP client — Claude Code, Cursor, or a custom integration — can
call these tools to get Unicode box-drawing output that renders cleanly
in monospace chat contexts. No ANSI escape codes, no terminal required.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

## Configure

Add to your MCP client config (e.g. `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "bijou": {
      "command": "node",
      "args": ["node_modules/@flyingrobots/bijou-mcp/bin/bijou-mcp.js"]
    }
  }
}
```

Or point directly at a local checkout:

```json
{
  "mcpServers": {
    "bijou": {
      "command": "node",
      "args": ["/path/to/bijou/packages/bijou-mcp/bin/bijou-mcp.js"]
    }
  }
}
```

## Tools

### Data and Structure

| Tool | What it renders |
| --- | --- |
| `bijou_table` | Box-drawn table with auto-sized columns |
| `bijou_tree` | Hierarchy with Unicode connectors |
| `bijou_dag` | Directed acyclic graph with boxed nodes and edge lines |
| `bijou_enumerated_list` | Bulleted, numbered, roman, or lettered lists |

### Containers and Layout

| Tool | What it renders |
| --- | --- |
| `bijou_box` | Bordered box with optional title |
| `bijou_header_box` | Labeled box with optional detail line |
| `bijou_separator` | Horizontal rule with optional centered label |
| `bijou_constrain` | Text truncated to a max width/height |

### Feedback and Status

| Tool | What it renders |
| --- | --- |
| `bijou_alert` | Alert box with icon (success, error, warning, info) |
| `bijou_progress_bar` | Static progress bar with percentage |
| `bijou_stepper` | Horizontal step indicator with checkmarks and dots |
| `bijou_timeline` | Vertical timeline with status dots |
| `bijou_log` | Styled log line with level prefix |
| `bijou_badge` | Inline pill label |

### Navigation

| Tool | What it renders |
| --- | --- |
| `bijou_tabs` | Horizontal tab bar with active indicator |
| `bijou_breadcrumb` | Breadcrumb trail with separators |
| `bijou_paginator` | Page indicator (dots or text) |

### Rich Panels

| Tool | What it renders |
| --- | --- |
| `bijou_explainability` | AI decision card with rationale, evidence, confidence |
| `bijou_inspector` | Detail panel with sections and current value |
| `bijou_accordion` | Collapsible sections with expand/collapse indicators |

### Utility

| Tool | What it renders |
| --- | --- |
| `bijou_kbd` | Keyboard key indicator |
| `bijou_hyperlink` | Plain link text and URL, with configurable fallback |
| `bijou_skeleton` | Placeholder loading block |
| `bijou_docs` | Machine-readable docs for the MCP surface plus the full first-party component-family field guide |

## Example Output

```
bijou_table

┌────────────┬─────────┬─────────┐
│ Name       │ Status  │ Version │
├────────────┼─────────┼─────────┤
│ bijou      │ healthy │ 5.0.0   │
│ bijou-node │ healthy │ 5.0.0   │
│ bijou-mcp  │ new     │ 5.0.0   │
└────────────┴─────────┴─────────┘

bijou_tree

├─ src
│  ├─ server.ts
│  ├─ context.ts
│  └─ tools/
└─ package.json

bijou_dag

╭──────────────╮
│ Parse        │
╰──────────────╯
        │
        ├──────────────────╮
        ▼                  ▼
╭──────────────╮  ╭──────────────╮
│ Validate     │  │ Tokenize     │
╰──────────────╯  ╰──────────────╯
        │                  │
        ├──────────────────┘
        ▼
╭──────────────╮
│ Compile      │
╰──────────────╯

bijou_stepper

✓ Plan ── ✓ Build ── ● Test ── ○ Ship

bijou_alert

┌──────────────────────┐
│ ✓ All tests passed.  │
└──────────────────────┘
```

## How It Works

The server creates a Bijou context using `createTestContext` with
`mode: 'interactive'` and `plainStyle()`. This gives full Unicode
box-drawing layout without ANSI escape codes — structured text that
renders correctly in any monospace context.

Each tool accepts structured JSON input, renders via the corresponding
Bijou component, and returns the result as a plain text string.

`bijou_hyperlink` uses the component's plain-text fallback rather than OSC 8
terminal controls: `both` (default) returns `text (url)`, `text` returns only
the label, and `url` returns only the target. This also applies to the
`structuredContent.rendered` field; the semantic payload keeps the original
text and URL.

All tools also accept an optional `output` field:

- `text` (default): return the rendered plain-text output in `content`
- `data`: return only MCP `structuredContent` with machine-readable semantic payload
- `both`: return both the rendered text and the structured payload

## Runtime compatibility

MCP uses SDK 1.32.1+ and Zod 4.6.6+. The Zod 4 migration retains tool names,
input fields, and the `text`, `data`, and `both` output modes. Validation error
wording may differ from Zod 3. The stdio regression checks discovery, public
input/output schemas, rejected arguments, and successful subsequent requests.

Repository overrides constrain this workspace's runtime dependency graph,
including body-parser 2.4.0+ and ip-address 10.7.4+. Downstream consumers
resolve their own dependency trees. This server uses stdio; dependency audit
results do not establish exposure or mitigation for hypothetical HTTP servers.

## License

Apache-2.0
