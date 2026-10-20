# Shell Owns Shell Concerns

## Protected by legends

- [HT — Humane Terminal](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md)
- [DF — DOGFOOD Field Guide](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md)

Global shell behavior should belong to the shell, not be reimplemented by each page.

Examples:

- search
- help
- settings
- notifications
- quit and confirmation flows

Implications:

- pages declare content and page-local behavior
- shell layers own shell routing, chrome, and discoverability
- polished shell patterns should graduate into canonical componentry when reusable
