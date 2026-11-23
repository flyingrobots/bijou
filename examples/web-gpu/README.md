# Web GPU showcase

Run Bijou example apps in a browser, on a `<canvas>`, through
`mountBijouCanvas()` and Geordi's WebGPU, WebGL2 and Canvas 2D presenters.
The page has a HUD that reports what the mount and each presenter's receipt
say, and controls that switch the backend, lose the WebGL2 context, and reset
the glyph atlas.

The reference for what the page mounts, what the HUD reports and what is
verified is [the showcase topic](../../docs/topics/web-gpu-showcase/README.md).

## Run the page

From the repository root, after `npm ci`:

```sh
npm run web-gpu
```

This starts the Vite development server on `http://127.0.0.1:5173`. Click the
Surface, then type: `+` or `k` increments the counter, `-` or `j` decrements it.

To serve the production bundle instead:

```sh
npm run web-gpu:build
npx vite preview --config examples/web-gpu/vite.config.ts --port 41797
```

`/dom.html` is the page the browser suite checks `mountBijouDom()` on.

The first mount is chosen in the address: `?app=counter`, `?app=components`,
`?app=hero` or `?app=showcase`,
and `&backend=auto` (the default), `webgpu`, `webgl2` or `canvas2d`.

## Run the browser suite

The suite needs Google Chrome installed. It builds the bundle, serves it on
port 41797, and drives it with Playwright:

```sh
npm run test:browser:web-gpu
```

| Variable | Default | Effect |
| --- | --- | --- |
| `BIJOU_WEB_GPU_PORT` | `41797` | The port the bundle is served on. Use a free one when another worktree runs the suite. |
| `BIJOU_WEB_GPU_BROWSER_CHANNEL` | `chrome` | `chromium` uses the browser that `npx playwright install chromium` downloads. |

Each test prints a `web-gpu-evidence` line naming the backend, the adapter and
the receipt's evidence level. Failures leave traces in `test-results/web-gpu/`.

This suite is the one test lane that runs outside the
[sealed runner](../../docs/guides/sealed-tests.md): the sealed workers have no
browser and no GPU. The sealed gate (`npm run code-dojo:ci`) still builds and
typechecks the page (`npm run web-gpu:build`, `npm run web-gpu:typecheck`) and
runs the tests in `tests/web-gpu/`.

## Refresh the pinned Geordi packages

`@flyingrobots/geordi-core` and `@flyingrobots/geordi-bijou-gpu` are not on
npm. The page uses tarballs packed from one Geordi commit, in `vendor/`, and
records the commit and every SHA-256 in `geordi-pin.json`. To move the pin, in
a Geordi checkout at the new commit (`<bijou>` stands for this repository's
root; the commands are illustrative):

```sh
pnpm install --frozen-lockfile
pnpm --filter @flyingrobots/geordi-core build
pnpm --filter @flyingrobots/geordi-bijou-gpu build
pnpm --filter @flyingrobots/geordi-core pack --pack-destination <bijou>/examples/web-gpu/vendor
pnpm --filter @flyingrobots/geordi-bijou-gpu pack --pack-destination <bijou>/examples/web-gpu/vendor
cp fixtures/bijou-gpu/procedural-glyphs.json <bijou>/examples/web-gpu/vendor/
```

`pnpm pack` names each tarball after the package version, so a new version
gives new file names. Then, in Bijou:

1. Delete the old tarballs from `vendor/`.
2. In `geordi-pin.json`, set the commit, and each package's `version`,
   `tarball` and `sha256` (from `shasum -a 256`), and the procedural table's
   `sha256`.
3. In the root `package.json`, point the `@flyingrobots/geordi-core` and
   `@flyingrobots/geordi-bijou-gpu` development dependencies at the new
   `file:examples/web-gpu/vendor/<name>-<version>.tgz` paths.
4. Run `npm install --package-lock-only --ignore-scripts` so the lockfile
   records the new tarballs and their integrity.

`tests/web-gpu/geordi-pin.test.ts` recomputes every digest and checks that the
manifest, the lockfile and the pin agree. `.gitattributes` keeps the vendored
files byte-exact on a checkout that converts line endings.

The vendored `procedural-glyphs.json` is a workaround for
flyingrobots/geordi#205: the Canvas 2D presenter needs the table and the
pinned package does not ship it. Once a pinned package ships the table, the
vendored copy can go.
