# README application captures

The two PNGs show production DOGFOOD views: the table component explorer in the book dark theme and Theme Lab in the book light theme. They are software cell captures, not photographs of a physical terminal or design mockups.

The application source was commit `0d9a068c5bbae85a78ce64d5c905e8146a27f4c4`. The capture adapter added here ran in the guarded `bijou-pr-validation` Docker worker against that source, at 140 columns by 36 rows. The light theme was selected through the settings keys. The retained `scenes.json` contains the actual glyphs and foreground/background colours returned by the application views.

`render.py` renders those cells with macOS CoreText and Menlo at 15 points, using 9 × 18 pixel cells. Unspecified colours inherit the first header cell’s colours. Text modifiers are not rasterized. Each resulting PNG is 1260 × 648 pixels; this is documentation artwork, not a physical-terminal parity claim.

To capture the current application again, run these commands inside the guarded worker after installing the committed lockfile:

```sh
npm run build
node --import tsx assets/screenshots/capture.ts > /data/scenes.json
```

Export `/data/scenes.json` to this directory, then render the retained cells on macOS:

```sh
python3 assets/screenshots/render.py
```

The renderer uses only system frameworks and does not run the application. Keep the scenes, PNGs, and source coordinates together when refreshing these images.
