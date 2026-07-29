# Keep Profunctor Page Conformance Fixture

These three inputs are byte-identical copies of the website-owned fixture at
revision
[`6a411d7`](https://github.com/flyingrobots/profunctor-optics-website/commit/6a411d72c55edb6e4acc3b556d5cf96c303376f5).

| File | SHA-256 |
| :--- | :--- |
| `input/page.profunctor.json` | `12b90184b4e238bc6bd7db944af8651900b830ea76ba775ab7c7ee20be051e73` |
| `input/page.profunctor.map.json` | `a40e97f2fd513519092d2a131c0d7107517b92bd7e9cfd5e79df70a65a3fe044` |
| `input/page.profunctor.build.json` | `975efc9c701cbd7a6981787150748b76d1e53fd83cd424128667bc8014687ab7` |

The website remains authoritative for these bytes. Refresh all three files,
their hashes, and the pinned revision together after an intentional contract
change. Bijou owns only its target lowering, map, receipt, and terminal witness.

The target profile is `bijou-terminal-project-page/1`. It supports the five
visible ProjectPage block definitions recorded in the fixture and emits:

- `generated/page.bijou.scene.json`
- `generated/page.bijou.map.json`
- `generated/page.bijou.receipt.json`
- `generated/page.bijou.txt`

See the
[Profunctor Page Inspection reference](../../../docs/reference/profunctor-page-inspection.md)
for the public API, modes, output contracts, and diagnostics.

Regenerate the Bijou-owned output:

```bash
npm run generate:profunctor-page-target
```

Generation stages the complete inventory before replacing `generated/`. A
failed installation preserves the previous directory or its explicit
`.previous` recovery directory. A later run refuses to overwrite that recovery
directory until an operator resolves it.

Verify the checked inventory and exact bytes:

```bash
npm run check:profunctor-page-target
```
