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
| `bijou_hyperlink` | Terminal hyperlink (OSC 8) |
| `bijou_skeleton` | Placeholder loading block |

## Example Output

```
bijou_table

┌────────────┬─────────┬─────────┐
│ Name       │ Status  │ Version │
├────────────┼─────────┼─────────┤
│ bijou      │ healthy │ 4.4.1   │
│ bijou-node │ healthy │ 4.4.1   │
│ bijou-mcp  │ new     │ 4.4.1   │
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

## License

Apache-2.0
