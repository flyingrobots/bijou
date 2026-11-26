// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from './contract.js';
import type { FontPort } from './demos/typeface.js';
import type { CatalogEntry, DemoHost } from './catalog-entry.js';

export type { CatalogEntry, DemoHost } from './catalog-entry.js';

/**
 * The demos, in the order every host lists them. Adding a demo is one entry here: the terminal shell lists it and the
 * browser gallery gives it a page of its own. The id, name and description repeat the demo's own, so that a list can
 * show them without loading the demo; a test holds the two equal. With a font that fails to load, the two demos that
 * draw outlines show a message in their pane and the rest work.
 */
export const catalog: readonly CatalogEntry[] = [
  {
    id: 'rainbow-gradient', name: 'Rainbow Gradient', description: 'Full-screen animated colour gradient from cosine waves',
    load: async () => (await import('./demos/rainbow.js')).rainbowGradient,
  },
  {
    id: 'wormhole', name: 'Retro Wormhole', description: 'Perspective rings and vector lines with drifting depth particles',
    load: async () => (await import('./demos/wormhole.js')).wormholeDemo,
  },
  {
    id: 'metaballs', name: 'Color-Blending Metaballs',
    description: 'Fluid blobs that merge, split and blend colours; the pointer carries one of them',
    load: async () => (await import('./demos/metaballs.js')).metaballsDemo,
  },
  {
    id: 'fluid', name: 'Fluid Dynamics Tank', description: 'A 2D particle fluid flowing around a hidden obstacle well',
    load: async () => (await import('./demos/fluid.js')).fluidDemo,
  },
  {
    id: 'flip-fluid', name: 'FLIP Dam Break', description: 'A hybrid grid and particle FLIP fluid dam break with a movable obstacle',
    load: async () => (await import('./demos/flip.js')).flipFluidDemo,
  },
  {
    id: 'raymarcher', name: '3D Raymarching Engine',
    description: 'A raymarched signed-distance scene with diffuse and specular light and soft shadows',
    load: async () => (await import('./demos/raymarcher.js')).raymarcherDemo,
  },
  {
    id: 'raycaster', name: 'Retro 3D Raycaster', description: 'First-person raycaster game: walk a maze, collect gold, shoot monsters',
    load: async () => (await import('./demos/raycaster.js')).raycasterDemo,
  },
  {
    id: 'raytracer', name: '3D Raytracer (The Works)',
    description: 'Animated raytracer in braille: reflections, soft shadows, caustics, rim light and depth of field',
    load: async () => (await import('./demos/raytracer.js')).raytracerDemo,
  },
  {
    id: 'font-renderer', name: 'TTF Font Vector Renderer', description: 'Typed text as outlines in animated braille',
    needsFont: true,
    load: async ({ font }) => (await import('./demos/font-renderer.js')).loadFontRenderer(font),
  },
  {
    id: 'starfield', name: 'Star Field',
    description: 'Stars rush past the viewer and leave fading trails, after Mike Bostock\'s d3 star field',
    load: async () => (await import('./demos/starfield.js')).starfieldDemo,
  },
  {
    id: 'directional-tiles', name: 'Directional Tiles',
    description: 'Fans of ink-to-paper wedges in a grid, turned by a drifting noise field, after Saneef Ansari',
    load: async () => (await import('./demos/tiles.js')).tilesDemo,
  },
  {
    id: 'doyle-spiral', name: 'Doyle Spiral',
    description: 'A Möbius-mapped Doyle spiral of touching circles, one hue per arm, after Robin Houston',
    load: async () => (await import('./demos/doyle.js')).doyleDemo,
  },
  {
    id: 'deformed-rectangles', name: 'Deformed Rectangles',
    description: 'A square split again and again at uneven ratios into skewed quads, after Saneef Ansari and Okazz',
    load: async () => (await import('./demos/rects.js')).rectsDemo,
  },
  {
    id: 'seamless-squares', name: 'Seamless Squares',
    description: 'Rows of squares in two colour ramps, turning and rocking on a sine wave, after cdr6934',
    load: async () => (await import('./demos/seamless.js')).seamlessDemo,
  },
  {
    id: 'truchet-tiles', name: 'Truchet Tiles',
    description: 'Quarter-circle Truchet tiles turned by a biased coin, re-tossed one by one, after Saneef Ansari',
    load: async () => (await import('./demos/truchet.js')).truchetDemo,
  },
  {
    id: 'some-triangles', name: 'Some Triangles',
    description: 'Triangles on one base, peaks crowding along a circle, after Saneef Ansari and Manfred Mohr',
    load: async () => (await import('./demos/triangles.js')).trianglesDemo,
  },
  {
    id: 'quadtree-shapes', name: 'Shapes on a QuadTree',
    description: 'Quadtree quadrants of circles, squares and slashes in a chromotome palette, after Saneef Ansari',
    load: async () => (await import('./demos/quadtree.js')).quadtreeDemo,
  },
  {
    id: 'dancing-noise', name: 'Dancing to the Noise',
    description: 'Bars broken by blocks that rise, fall and swell with a drifting noise field, after Saneef Ansari',
    load: async () => (await import('./demos/dancing.js')).dancingDemo,
  },
  {
    id: 'seeded-needles', name: 'Seeded Needles',
    description: 'A grid of needles turned by a seeded, slowly drifting noise field, after Saneef Ansari',
    load: async () => (await import('./demos/needles.js')).needlesDemo,
  },
  {
    id: 'xor-mod-n', name: 'x ^ y mod n',
    description: 'Cells lit where (x XOR y) mod n is zero, drifting across the plane, after Saneef Ansari',
    load: async () => (await import('./demos/xor-mod.js')).xorModDemo,
  },
  {
    id: 'box-grid', name: 'Tumbling Box Grid',
    description: 'An orbiting camera over 121 lit cubes, each tumbling at its own angle, after Claudio Esperança',
    load: async () => (await import('./demos/box-grid.js')).boxGridDemo,
  },
  {
    id: 'lenses', name: 'Lenses',
    description: 'Rays and wave fronts from a point source through two thin lenses, after Claudio Esperança',
    load: async () => (await import('./demos/lenses.js')).lensesDemo,
  },
  {
    id: 'noise-plane-partition', name: 'Noise Plane Partition',
    description: 'The plane cut again and again along noise flow lines, level by level, after Claudio Esperança',
    load: async () => (await import('./demos/noise-partition.js')).noisePartitionDemo,
  },
  {
    id: 'partition-peel', name: 'Partition Peel',
    description: 'A noise-cut plane peels away piece by piece, tumbling, then reassembles, after Claudio Esperança',
    load: async () => (await import('./demos/noise-partition-peel.js')).partitionPeelDemo,
  },
  { id: 'wave-surface', name: '3D Wave Surface',
    description: 'A lit 3D surface of ripple, spiral and chaotic waves cross-fading, after laotzunami\'s Three.js graph',
    load: async () => (await import('./demos/surface.js')).surfaceDemo },
  {
    id: 'text-cylinder', name: '3D Text Cylinder Ticker', description: 'Letters rolling over a 3D text cylinder',
    needsFont: true,
    load: async ({ font }) => (await import('./demos/text-cylinder.js')).loadTextCylinder(font),
  },
];

/** Load every demo of `entries`, in order, for a host that lists them all. The font is asked for once, however many demos draw it. */
export function loadDemos(host: DemoHost, entries: readonly CatalogEntry[] = catalog): Promise<DemoEntry[]> {
  let bytes: ReturnType<FontPort> | undefined;
  const once: DemoHost = { font: () => (bytes ??= host.font()) };
  return Promise.all(entries.map((entry) => entry.load(once)));
}
