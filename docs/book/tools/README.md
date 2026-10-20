# Book artwork tools

The book stores actual Surface cell captures and vector projections. No component is redrawn by hand.

From the Bijou root, with its existing dependencies installed:

```sh
node --import tsx docs/book/tools/capture-tables.mjs /tmp/bijou-design-book/table-frames.json
PYTHONPATH=/tmp/bijou-design-book/python python3 docs/book/tools/vector-cells.py /tmp/bijou-design-book/table-frames.json docs/book/fonts /tmp/bijou-design-book/table-artwork '#ffffff' '#2d2726'
PYTHONPATH=/tmp/bijou-design-book/python python3 docs/book/tools/direct-cell-pdf.py /tmp/bijou-design-book/table-frames.json docs/book/fonts /tmp/bijou-design-book/table-artwork '#ffffff' '#2d2726'
```

The PDF projector embeds reusable fonts instead of expanding every repeated glyph to a separate path. Cell geometry and font outlines are the same; glyph antialiasing can differ between PDF text and outlined SVG.

The Python projector requires fonttools and pymupdf. It resumes existing SVG/PDF pairs only when the recorded cell digest matches. Remove the identified owned output pairs when changing font outlines or projection code; a cell digest does not identify the renderer. Fonts and static Recursive axis settings are recorded in `font-provenance.json`.

`table-data.json` contains the original structured table values and the explicit illustrated callout. `table-manifest.json` records column groups, row ranges and repeated headers. `component-captures.json` preserves 42 DOGFOOD frames; `demo-captures.json` preserves two bijou-fun frames. `monitor-captures.json` and the text outputs under `figures/monitor/` preserve the pinned companion output.

The original 426 Markdown records remain byte-preserved in `source-corpus.json`. Flow source notation and its graph representation are recorded in `flow-manifest.json`; the native TikZ drawings are modular files under `diagrams/`.

Keep all temporary output in an owned, monitored directory; use the project's worker and resource lock described in the book README. The commands above are regeneration steps, not permission to bypass workstation build guards.
