# DM Sans

DM Sans by the DM Sans Project Authors is distributed under the accompanying
SIL Open Font License 1.1 (`OFL.txt`).

Source: [Google Fonts, pinned revision](https://github.com/google/fonts/tree/5b35b7208dd4100571326fdf37f030b32a524232/ofl/dmsans).
The upstream `DMSans[opsz,wght].ttf` is bundled unmodified as `DMSans.ttf`.
SHA-256: `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d`.

`npm run generate:components:title` compiles printable ASCII coverage from the
font's default outlines to `assets/dm-sans-ascii.json`;
`npm run check:components:title` verifies it. The Components Library
(`npm run components`) draws its title screen from this atlas, with no runtime
font decoder and no network access.
