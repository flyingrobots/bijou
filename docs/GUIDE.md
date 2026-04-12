# Guide

This is the repo-level operator guide for Bijou.

Use it when you want to know which surface to read next. It is not a package API
reference and it is not a backlog file.

## Choose Your Lane

### Learn Bijou

Start with:

- [Root README](../README.md)
- [DOGFOOD](./DOGFOOD.md)
- package guides:
  [bijou](../packages/bijou/GUIDE.md),
  [bijou-tui](../packages/bijou-tui/GUIDE.md),
  [bijou-node](../packages/bijou-node/GUIDE.md)

### Build Something

Use the package guides for the common path:

- [Core toolkit guide](../packages/bijou/GUIDE.md)
- [Runtime guide](../packages/bijou-tui/GUIDE.md)
- [Node boundary guide](../packages/bijou-node/GUIDE.md)

When the work becomes architectural, shell-owned, pipeline-sensitive, or
workflow-heavy, move to:

- [ADVANCED_GUIDE.md](../ADVANCED_GUIDE.md)
- package advanced guides under `packages/*/ADVANCED_GUIDE.md`

### Work On The Repo

If the question is “what is true right now?” read:

- [docs/README.md](./README.md)
- [METHOD](./METHOD.md)
- [BEARING](./BEARING.md)
- [VISION](./VISION.md)
- [CHANGELOG](./CHANGELOG.md)

### Ship A Release

Use:

- [Release Guide](./release.md)
- [Release Docs Index](./releases/README.md)
- [CLI Signpost](./CLI.md)

### Use MCP Or Chat-Context Rendering

Use:

- [MCP Signpost](./MCP.md)
- [@flyingrobots/bijou-mcp README](../packages/bijou-mcp/README.md)

### Contribute Or Operate In Public

Use:

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- [SECURITY.md](../SECURITY.md)

## Rule Of Thumb

If you need an inventory, use [docs/README.md](./README.md).

If you need the fast path, use the root README and package guides.

If you need the deeper doctrine behind shells, rendering, i18n, proving apps,
or release/test workflows, use [ADVANCED_GUIDE.md](../ADVANCED_GUIDE.md).
