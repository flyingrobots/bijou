// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// Colour lists for the generative demos, embedded so the demos fetch nothing.
// Ink colours after the riso-colors list and paper colours after the
// paper-colors list (both by Matt DesLauriers, MIT); the quad palettes after
// chromotome (Kjetil Golid, MIT). A subset, with values as published.

/** Risograph ink colours. */
export const INKS: readonly string[] = [
  '#ff48b0', '#0078bf', '#00a95c', '#ffe800', '#ff6c2f', '#765ba7', '#e45d50', '#3d5588',
  '#00838a', '#f15060', '#5ec8e5', '#000000', '#a75154', '#62a8e5', '#ffb511', '#bb8b41',
];

/** Paper colours, light and dark. */
export const PAPERS: readonly string[] = [
  '#f8f3e8', '#efe9d9', '#e2d7c1', '#fbf7f0', '#f3efe6', '#d8d2c4',
  '#364b72', '#2f353b', '#3e3b35', '#645d53', '#232323',
];

export interface QuadPalette {
  readonly name: string;
  readonly colors: readonly string[];
  readonly background: string;
  readonly stroke: string;
}

/** Palettes for the deformed rectangles: fills, the ground behind them and the line between them. */
export const QUAD_PALETTES: readonly QuadPalette[] = [
  { name: 'tundra', colors: ['#ff5765', '#3fbfbf', '#ffb21e', '#e5e5d1', '#3d3b4f'], background: '#f5ecdf', stroke: '#2b2a35' },
  { name: 'cc239', colors: ['#e3dd34', '#78496b', '#f0527f', '#a7e0e2'], background: '#e0eff0', stroke: '#1a1a1a' },
  { name: 'hilda', colors: ['#ec643b', '#56b7ab', '#f8cb57', '#1f1e43'], background: '#f7f1df', stroke: '#1f1e43' },
  { name: 'kov', colors: ['#d24c23', '#7ba6bc', '#f0c667', '#ede2b3', '#672b35', '#142a36'], background: '#132a37', stroke: '#108266' },
  { name: 'dt09', colors: ['#000000', '#a10000', '#bfb9ad', '#e3d6b5'], background: '#ffffff', stroke: '#000000' },
  { name: 'ducci', colors: ['#f7c873', '#2e56a3', '#e8a24c', '#29303b', '#e0d5bf'], background: '#efe5d1', stroke: '#2a2a2a' },
];

/** The colour list of "(Day 8 of 30) Seamless Patterns in P5.js" by cdr6934 (Observable), as published. */
export const SEAMLESS_COLORS: readonly string[] = [
  '#6cb59d', '#7bc6b3', '#a9d5c8', '#d5e1ce', '#77bcb4', '#7cb1d0', '#507b96', '#8ec4db', '#8fb8c2', '#565c65',
  '#e7c558', '#e48d4d', '#c6a896', '#e2cdc0', '#e1ccbf', '#f5e8da', '#f9f9f5', '#b1b7b9', '#ccdac6', '#68514b',
  '#dd5c4e', '#e67047', '#d07060', '#db7169', '#689b9b', '#f19f9d', '#365a5e', '#f6cfc4', '#516d67', '#3d485d',
];

/** The palette list of "Generative Painting" by Karim Douieb (Observable), after nice-color-palettes, as published. */
export const NICE_PALETTES: readonly (readonly string[])[] = [
  ['#69d2e7', '#a7dbd8', '#e0e4cc', '#f38630', '#fa6900'],
  ['#99b898', '#fecea8', '#ff847c', '#e84a5f', '#2a363b'],
  ['#ffe181', '#eee9e5', '#fad3b2', '#ffba7f', '#ff9c97'],
  ['#f8b195', '#f67280', '#c06c84', '#6c5b7b', '#355c7d'],
  ['#5e9fa3', '#dcd1b4', '#fab87f', '#f87e7b', '#b05574'],
  ['#b9d3b0', '#81bda4', '#b28774', '#f88f79', '#f6aa93'],
  ['#3a111c', '#574951', '#83988e', '#bcdea5', '#e6f9bc'],
  ['#fc354c', '#29221f', '#13747d', '#0abfbc', '#fcf7c5'],
  ['#fe4365', '#fc9d9a', '#f9cdad', '#c8c8a9', '#83af9b'],
  ['#aab3ab', '#c4cbb7', '#ebefc9', '#eee0b7', '#e8caaf'],
  ['#e8ddcb', '#cdb380', '#036564', '#033649', '#031634'],
  ['#a7c5bd', '#e5ddcb', '#eb7b59', '#cf4647', '#524656'],
  ['#3fb8af', '#7fc7af', '#dad8a7', '#ff9e9d', '#ff3d7f'],
  ['#a1dbb2', '#fee5ad', '#faca66', '#f7a541', '#f45d4c'],
  ['#99b898', '#fecea8', '#ff847c', '#e84a5f', '#2a363b'],
];
