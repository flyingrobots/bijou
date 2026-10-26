import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIJOU_DARK, BIJOU_LIGHT } from '../../../../packages/bijou/src/index.ts';
import { rasterToGlyphSurface } from '../../../../packages/bijou-tui/src/index.ts';
import { rasterizeSvgToRgba } from '../../../../examples/docs/svg-raster.ts';

const here = dirname(fileURLToPath(import.meta.url));
const checkOnly = process.argv.includes('--check');
const COLS = 150;
const ROWS = 44;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 20;
const WIDTH = COLS * CELL_WIDTH;
const HEIGHT = ROWS * CELL_HEIGHT;
const logoSource = readFileSync(resolve(here, '../../../../assets/Bijou.svg'), 'utf8');

function svgTheme(mode, theme) {
  return {
    mode,
    label: `DOGFOOD / ${mode.toUpperCase()}`,
    primaryBg: theme.surface.primary.bg,
    secondaryBg: theme.surface.secondary.bg,
    elevatedBg: theme.surface.elevated.bg,
    mutedBg: theme.surface.muted.bg,
    primary: theme.semantic.primary.hex,
    secondary: theme.surface.secondary.hex,
    muted: theme.semantic.muted.hex,
    border: theme.border.muted.hex,
    borderStrong: theme.border.primary.hex,
    accent: theme.semantic.accent.hex,
    success: theme.semantic.success.hex,
    warning: theme.semantic.warning.hex,
    error: theme.semantic.error.hex,
    info: theme.semantic.info.hex,
  };
}

const themes = Object.freeze({
  dark: svgTheme('dark', BIJOU_DARK),
  light: svgTheme('light', BIJOU_LIGHT),
});

class CellGrid {
  constructor(theme) {
    this.theme = theme;
    this.cells = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({
      char: ' ', fg: theme.primary, bg: theme.primaryBg, bold: false, dim: false,
    })));
  }

  write(row, column, value, style = {}) {
    let x = column;
    for (const char of Array.from(String(value))) {
      if (row >= 0 && row < ROWS && x >= 0 && x < COLS) {
        const cell = this.cells[row][x];
        cell.char = char;
        if (style.fg !== undefined) cell.fg = style.fg;
        if (style.bg !== undefined) cell.bg = style.bg;
        if (style.bold !== undefined) cell.bold = style.bold;
        if (style.dim !== undefined) cell.dim = style.dim;
      }
      x += 1;
    }
  }

  fill(top, left, width, height, style = {}) {
    for (let row = top; row < Math.min(ROWS, top + height); row += 1) {
      for (let column = left; column < Math.min(COLS, left + width); column += 1) {
        const cell = this.cells[row][column];
        cell.char = style.char ?? ' ';
        if (style.fg !== undefined) cell.fg = style.fg;
        if (style.bg !== undefined) cell.bg = style.bg;
        if (style.bold !== undefined) cell.bold = style.bold;
        if (style.dim !== undefined) cell.dim = style.dim;
      }
    }
  }

  horizontal(row, left, width, style = {}) {
    this.write(row, left, '─'.repeat(Math.max(0, width)), style);
  }

  vertical(top, column, height, style = {}) {
    for (let row = top; row < top + height; row += 1) this.write(row, column, '│', style);
  }

  box(top, left, width, height, title = '', style = {}) {
    const tone = { fg: style.fg ?? this.theme.border, bold: style.bold ?? false };
    this.write(top, left, `┌${'─'.repeat(Math.max(0, width - 2))}┐`, tone);
    this.write(top + height - 1, left, `└${'─'.repeat(Math.max(0, width - 2))}┘`, tone);
    this.vertical(top + 1, left, height - 2, tone);
    this.vertical(top + 1, left + width - 1, height - 2, tone);
    if (title !== '') this.write(top, left + 2, ` ${title} `, { fg: tone.fg, bold: true });
  }
}

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function logoGlyphs(columns, rows) {
  const frame = rasterizeSvgToRgba(logoSource, { width: columns * 2, height: rows * 4 });
  const surface = rasterToGlyphSurface(frame, {
    columns,
    rows,
    fit: 'stretch',
    colorMode: 'none',
    renderer: { kind: 'charset', chars: ' ░▒▓█', order: 'light-to-dark' },
  });
  return Array.from({ length: rows }, (_, row) => Array.from(
    { length: columns },
    (_, column) => surface.get(column, row).char ?? ' ',
  ).join(''));
}

function writeLogo(grid, top, left, columns, rows, tone) {
  logoGlyphs(columns, rows).forEach((line, index) => grid.write(top + index, left, line, { fg: tone, bold: true }));
}

function drawShell(grid, direction) {
  const t = grid.theme;
  grid.fill(0, 0, COLS, 1, { bg: t.secondaryBg });
  grid.write(0, 1, 'BIJOU DOCS', { fg: t.primary, bold: true });
  grid.write(0, 15, '[HOME]', { fg: t.primaryBg, bg: t.accent, bold: true });
  grid.write(0, 23, 'GUIDES', { fg: t.muted });
  grid.write(0, 32, 'COMPONENTS', { fg: t.muted });
  grid.write(0, 45, 'BLOCKS', { fg: t.muted });
  grid.write(0, 54, 'PACKAGES', { fg: t.muted });
  grid.write(0, 64, 'PHILOSOPHY', { fg: t.muted });
  grid.write(0, 77, 'THEMES', { fg: t.muted });
  grid.write(0, 86, 'RELEASE', { fg: t.muted });
  grid.write(0, 132, t.label, { fg: t.accent, bold: true });
  grid.horizontal(1, 0, COLS, { fg: t.border });
  grid.write(2, 2, `home • ${direction}`, { fg: t.muted, dim: true });
  grid.horizontal(42, 0, COLS, { fg: t.border });
  grid.fill(43, 0, COLS, 1, { bg: t.secondaryBg });
  grid.write(43, 1, '[NORMAL] page:home pane:home', { fg: t.muted });
  grid.write(43, 47, '? Help • / Search • F2 Settings • q Quit • Tab next pane', { fg: t.secondary });
  grid.write(43, 142, 'v7.2.0', { fg: t.primary, bold: true });
}

function drawCommandDeck(theme) {
  const grid = new CellGrid(theme);
  drawShell(grid, 'command deck');
  grid.box(4, 2, 94, 37, 'HOME', { fg: theme.border });
  grid.box(4, 97, 51, 37, 'START HERE', { fg: theme.accent, bold: true });
  grid.write(6, 7, 'THE DOCUMENTATION PROVING GROUND', { fg: theme.accent, bold: true });
  writeLogo(grid, 8, 7, 78, 8, theme.accent);
  grid.write(18, 7, 'DOCUMENTATION OF GOOD FOUNDATIONAL ONBOARDING AND DISCOVERY', { fg: theme.secondary, bold: true });
  grid.horizontal(20, 7, 80, { fg: theme.border });
  grid.write(22, 7, 'BUILD THE INTERFACE.', { fg: theme.primary, bold: true });
  grid.write(24, 7, 'PROVE THE SYSTEM.', { fg: theme.primary, bold: true });
  grid.write(27, 7, 'One terminal surface for docs, examples, Blocks, and release truth.', { fg: theme.secondary });
  grid.fill(30, 7, 29, 3, { bg: theme.accent });
  grid.write(31, 9, '[ ENTER ]  OPEN DOGFOOD', { fg: theme.primaryBg, bg: theme.accent, bold: true });
  grid.write(35, 7, '● LIVE', { fg: theme.success, bold: true });
  grid.write(35, 17, 'interactive • static • pipe • accessible', { fg: theme.muted });
  grid.write(38, 7, 'V7 LAUNCH WAKE', { fg: theme.info, bold: true });
  grid.write(38, 25, 'A released line leaves a readable trail.', { fg: theme.muted, dim: true });

  const routes = [
    ['01', 'GUIDES', 'Start with the system map', 'ENTER'],
    ['02', 'COMPONENTS', 'Explore the live vocabulary', 'C'],
    ['03', 'BLOCKS', 'Inspect product contracts', 'B'],
    ['04', 'PACKAGES', 'Choose the right boundary', 'P'],
  ];
  routes.forEach(([number, label, detail, key], index) => {
    const row = 7 + (index * 7);
    if (index === 0) {
      grid.fill(row - 1, 99, 47, 5, { bg: theme.elevatedBg });
      grid.write(row - 1, 99, '▌', { fg: theme.accent, bg: theme.elevatedBg, bold: true });
    }
    grid.write(row, 102, number, { fg: theme.accent, bold: true });
    grid.write(row, 107, label, { fg: theme.primary, bold: true });
    grid.write(row + 2, 107, detail, { fg: theme.muted });
    grid.write(row + 2, 140, `[${key}]`, { fg: theme.borderStrong, bold: true });
    if (index < routes.length - 1) grid.horizontal(row + 4, 101, 43, { fg: theme.border });
  });
  grid.box(35, 100, 45, 4, 'CURRENT RELEASE', { fg: theme.info });
  grid.write(37, 103, 'V7 LAUNCH WAKE', { fg: theme.primary, bold: true });
  grid.write(37, 135, '[PROVEN]', { fg: theme.info, bold: true });
  return grid;
}

function drawProofAtlas(theme) {
  const grid = new CellGrid(theme);
  drawShell(grid, 'proof atlas');
  grid.write(4, 4, 'DOGFOOD / V7 LAUNCH WAKE', { fg: theme.accent, bold: true });
  grid.write(6, 4, 'ONE AUTHORED SYSTEM.', { fg: theme.primary, bold: true });
  grid.write(8, 4, 'EVERY HONEST RENDERING.', { fg: theme.accent, bold: true });
  writeLogo(grid, 4, 104, 40, 5, theme.borderStrong);
  grid.horizontal(10, 4, 140, { fg: theme.accent });

  const nodes = [
    [4, '01', 'GRAPHQL SDL', 'authored source', 'BOUND'],
    [40, '02', 'BIJOU BLOCK', 'product contract', 'BOUND'],
    [76, '03', 'SCENE IR', 'portable structure', 'BOUND'],
    [112, '04', 'SURFACE', 'terminal proof', 'LIVE'],
  ];
  nodes.forEach(([left, number, label, detail, status], index) => {
    grid.box(13, left, 31, 9, '', { fg: index === 3 ? theme.accent : theme.border });
    grid.write(14, left + 2, number, { fg: theme.accent, bold: true });
    grid.write(14, left + 21, `[${status}]`, { fg: status === 'LIVE' ? theme.success : theme.borderStrong, bold: true });
    grid.write(17, left + 2, label, { fg: theme.primary, bold: true });
    grid.write(19, left + 2, detail, { fg: theme.muted });
    if (index < nodes.length - 1) grid.write(17, left + 31, '───▶', { fg: theme.accent, bold: true });
  });

  grid.box(24, 2, 96, 17, 'PRODUCT PROOF', { fg: theme.border });
  grid.write(27, 5, 'DOGFOOD is not a showcase pasted on top.', { fg: theme.primary, bold: true });
  grid.write(29, 5, 'It is the same runtime, layout, theme, and lowering system', { fg: theme.secondary });
  grid.write(30, 5, 'that application authors use.', { fg: theme.secondary });
  grid.horizontal(32, 5, 89, { fg: theme.border });
  grid.write(34, 5, '[INTERACTIVE]', { fg: theme.accent, bold: true });
  grid.write(34, 20, '[STATIC]', { fg: theme.info, bold: true });
  grid.write(34, 31, '[PIPE]', { fg: theme.warning, bold: true });
  grid.write(34, 40, '[ACCESSIBLE]', { fg: theme.success, bold: true });
  grid.write(37, 5, 'tests are the executable specification', { fg: theme.muted, dim: true });

  grid.box(24, 99, 49, 17, 'SYSTEM POSTURE', { fg: theme.accent });
  grid.write(27, 102, 'render path', { fg: theme.muted });
  grid.write(27, 136, 'VERIFIED', { fg: theme.success, bold: true });
  grid.horizontal(29, 102, 42, { fg: theme.border });
  grid.write(31, 102, 'theme family', { fg: theme.muted });
  grid.write(31, 139, theme.mode.toUpperCase(), { fg: theme.accent, bold: true });
  grid.horizontal(33, 102, 42, { fg: theme.border });
  grid.write(35, 102, 'release story', { fg: theme.muted });
  grid.write(35, 137, 'CURRENT', { fg: theme.info, bold: true });
  grid.horizontal(37, 102, 42, { fg: theme.border });
  grid.write(39, 102, 'open proof', { fg: theme.muted });
  grid.write(39, 136, 'ENTER ─▶', { fg: theme.accent, bold: true });
  return grid;
}

function drawEditorialIndex(theme) {
  const grid = new CellGrid(theme);
  drawShell(grid, 'editorial index');
  grid.box(4, 2, 36, 37, 'INDEX', { fg: theme.accent });
  grid.box(4, 39, 109, 37, 'HOME', { fg: theme.border });
  const indexRows = [
    ['▌', 'HOME', 'overview'], ['', 'GUIDES', 'start here'], ['', 'COMPONENTS', 'live catalog'],
    ['', 'BLOCKS', 'contracts'], ['', 'PACKAGES', 'boundaries'], ['', 'PHILOSOPHY', 'doctrine'],
    ['', 'THEMES', 'tokens'], ['', 'RELEASE', 'current truth'],
  ];
  indexRows.forEach(([marker, label, detail], index) => {
    const row = 7 + (index * 4);
    if (index === 0) grid.fill(row - 1, 4, 32, 3, { bg: theme.elevatedBg });
    grid.write(row, 4, marker, { fg: theme.accent, bg: index === 0 ? theme.elevatedBg : undefined, bold: true });
    grid.write(row, 7, label, { fg: index === 0 ? theme.primary : theme.secondary, bold: true });
    grid.write(row + 1, 7, detail, { fg: theme.muted, dim: true });
  });

  grid.write(6, 44, 'DOGFOOD / HOME', { fg: theme.accent, bold: true });
  writeLogo(grid, 8, 44, 78, 8, theme.accent);
  grid.write(18, 44, 'DOCS THAT PROVE THEMSELVES.', { fg: theme.primary, bold: true });
  grid.write(20, 44, 'A living field guide for Bijou.', { fg: theme.primary, bold: true });
  grid.write(22, 44, 'Every page exercises the same terminal system it teaches.', { fg: theme.secondary });
  grid.horizontal(24, 44, 98, { fg: theme.border });
  grid.write(26, 44, '01  GUIDES', { fg: theme.accent, bold: true });
  grid.write(26, 64, 'Orientation, fast paths, and doctrine.', { fg: theme.muted });
  grid.write(28, 44, '02  COMPONENTS', { fg: theme.accent, bold: true });
  grid.write(28, 64, 'Every family, rendered and explained.', { fg: theme.muted });
  grid.write(30, 44, '03  BLOCKS', { fg: theme.accent, bold: true });
  grid.write(30, 64, 'Product semantics with inspectable contracts.', { fg: theme.muted });
  grid.write(32, 44, '04  PACKAGES', { fg: theme.accent, bold: true });
  grid.write(32, 64, 'Ports, adapters, and package boundaries.', { fg: theme.muted });
  grid.horizontal(34, 44, 98, { fg: theme.border });
  grid.write(36, 44, '[ ENTER ]  OPEN THE FIELD GUIDE', { fg: theme.primaryBg, bg: theme.accent, bold: true });
  grid.write(38, 44, 'CURRENT RELEASE  V7 LAUNCH WAKE', { fg: theme.info, bold: true });
  grid.write(38, 82, 'A released line leaves a readable trail.', { fg: theme.muted, dim: true });
  return grid;
}

const directions = Object.freeze([
  { id: 'command-deck', label: 'Command Deck', draw: drawCommandDeck },
  { id: 'proof-atlas', label: 'Proof Atlas', draw: drawProofAtlas },
  { id: 'editorial-index', label: 'Editorial Index', draw: drawEditorialIndex },
]);

function backgroundMarkup(grid) {
  const runs = [];
  for (let row = 0; row < ROWS; row += 1) {
    let column = 0;
    while (column < COLS) {
      const color = grid.cells[row][column].bg;
      const start = column;
      while (column < COLS && grid.cells[row][column].bg === color) column += 1;
      if (color !== grid.theme.primaryBg) runs.push(`<rect x="${start * CELL_WIDTH}" y="${row * CELL_HEIGHT}" width="${(column - start) * CELL_WIDTH}" height="${CELL_HEIGHT}" fill="${color}"/>`);
    }
  }
  return runs.join('\n    ');
}

function textMarkup(grid) {
  const runs = [];
  for (let row = 0; row < ROWS; row += 1) {
    let column = 0;
    while (column < COLS) {
      while (column < COLS && grid.cells[row][column].char === ' ') column += 1;
      if (column >= COLS) break;
      const start = column;
      const first = grid.cells[row][column];
      let value = '';
      while (column < COLS) {
        const cell = grid.cells[row][column];
        if (cell.fg !== first.fg || cell.bold !== first.bold || cell.dim !== first.dim) break;
        value += cell.char;
        column += 1;
      }
      value = value.trimEnd();
      if (value.length === 0) continue;
      const weight = first.bold ? ' font-weight="800"' : '';
      const opacity = first.dim ? ' opacity="0.68"' : '';
      runs.push(`<text x="${start * CELL_WIDTH}" y="${(row * CELL_HEIGHT) + 15.5}" fill="${first.fg}" textLength="${Array.from(value).length * CELL_WIDTH}" lengthAdjust="spacingAndGlyphs"${weight}${opacity}>${esc(value)}</text>`);
    }
  }
  return runs.join('\n    ');
}

function documentFor(direction, mode, theme) {
  const grid = direction.draw(theme);
  const titleId = `${direction.id}-${mode}-title`;
  const descId = `${direction.id}-${mode}-description`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="${titleId} ${descId}" data-direction="${direction.id}" data-theme="${mode}" data-columns="${COLS}" data-rows="${ROWS}" shape-rendering="crispEdges">
  <title id="${titleId}">DOGFOOD Home — ${direction.label} — ${theme.label}</title>
  <desc id="${descId}">A conceptual ${COLS} by ${ROWS} terminal-cell DOGFOOD Home tab using the shipped Sapphire Noir ${mode} palette.</desc>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${theme.primaryBg}"/>
  <g aria-hidden="true">
    ${backgroundMarkup(grid)}
  </g>
  <g aria-hidden="true" font-family="SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace" font-size="15.5px">
    ${textMarkup(grid)}
  </g>
</svg>\n`;
}

function validateTuiDocument(svg, theme, filename) {
  const allowedColors = new Set(Object.values(theme).filter((value) => /^#[0-9a-f]{6}$/i.test(value)));
  const emittedColors = new Set(svg.match(/#[0-9a-f]{6}/gi) ?? []);
  const unknownColors = [...emittedColors].filter((color) => !allowedColors.has(color));
  if (unknownColors.length > 0) throw new Error(`${filename} emits non-theme colors: ${unknownColors.join(', ')}`);
  for (const required of ['role="img"', 'aria-labelledby=', 'data-columns="150"', 'data-rows="44"', '<title ', '<desc ', '┌', '│', '░']) {
    if (!svg.includes(required)) throw new Error(`${filename} lacks ${required}`);
  }
  for (const forbidden of [' rx=', '<circle', '<path', '<filter', 'feDropShadow']) {
    if (svg.includes(forbidden)) throw new Error(`${filename} contains non-cell vector chrome: ${forbidden}`);
  }
}

let drift = false;
for (const direction of directions) {
  for (const [mode, theme] of Object.entries(themes)) {
    const filename = `${direction.id}-${mode}.svg`;
    const path = resolve(here, filename);
    const expected = documentFor(direction, mode, theme);
    validateTuiDocument(expected, theme, filename);
    if (checkOnly) {
      let actual = '';
      try { actual = readFileSync(path, 'utf8'); } catch { /* reported below */ }
      if (actual !== expected) { console.error(`out of date: ${filename}`); drift = true; }
    } else {
      writeFileSync(path, expected);
      console.log(`wrote ${filename}`);
    }
  }
}
if (drift) process.exitCode = 1;
