# Release Docs

Long-form release documentation lives under `docs/releases/`.

Use this directory for material that is more explanatory than
[`CHANGELOG.md`](../CHANGELOG.md):

- release overviews and "what changed" walkthroughs
- migration guides for existing users
- version-specific notes that should stay readable after the release is
  no longer "current"

## Working Rule

While a release version is still undecided, draft the long-form docs in
`docs/releases/next/`.

When the version is chosen, move that directory to the real release
path:

```text
docs/releases/next/
  -> docs/releases/X.Y.Z/
```

## Current Shaped Release Docs

- [What's New (v5.0.0)](./5.0.0/whats-new.md)
- [Migration Guide (v5.0.0)](./5.0.0/migration-guide.md)

## Previous Release Docs

- [What's New (v4.4.1)](./4.4.1/whats-new.md)
- [Migration Guide (v4.4.1)](./4.4.1/migration-guide.md)
- [What's New (v4.4.0)](./4.4.0/whats-new.md)
- [Migration Guide (v4.4.0)](./4.4.0/migration-guide.md)
- [What's New (v4.3.0)](./4.3.0/whats-new.md) | [Migration Guide](./4.3.0/migration-guide.md)
- [What's New (v4.2.0)](./4.2.0/whats-new.md) | [Migration Guide](./4.2.0/migration-guide.md)
- [What's New (v4.1.0)](./4.1.0/whats-new.md) | [Migration Guide](./4.1.0/migration-guide.md)
