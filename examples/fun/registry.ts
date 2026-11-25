// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from './contract.js';
import type { FontPort } from './demos/typeface.js';

/** What a host hands a demo that needs something from outside the program: the bytes of the font, through a port. */
export interface DemoHost {
  readonly font: FontPort;
}

/** One demo of the catalog: what a list shows before any demo's code has loaded, and how to load that code. */
export interface CatalogEntry {
  readonly id: string;
  readonly name: string;
  /** One line. */
  readonly description: string;
  /** Import this demo's module, which no other entry imports, and build the demo. */
  load(host: DemoHost): Promise<DemoEntry>;
}

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
    load: async ({ font }) => (await import('./demos/font-renderer.js')).loadFontRenderer(font),
  },
  {
    id: 'text-cylinder', name: '3D Text Cylinder Ticker', description: 'Letters rolling over a 3D text cylinder',
    load: async ({ font }) => (await import('./demos/text-cylinder.js')).loadTextCylinder(font),
  },
];

/** Load every demo of `entries`, in order, for a host that lists them all. The font is asked for once, however many demos draw it. */
export function loadDemos(host: DemoHost, entries: readonly CatalogEntry[] = catalog): Promise<DemoEntry[]> {
  let bytes: ReturnType<FontPort> | undefined;
  const once: DemoHost = { font: () => (bytes ??= host.font()) };
  return Promise.all(entries.map((entry) => entry.load(once)));
}
