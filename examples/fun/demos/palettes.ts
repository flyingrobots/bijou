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
