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

Regenerate the Bijou-owned output:

```bash
npm run generate:profunctor-page-target
```

Verify the checked inventory and exact bytes:

```bash
npm run check:profunctor-page-target
```
