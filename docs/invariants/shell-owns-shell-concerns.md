# Shell Owns Shell Concerns

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
