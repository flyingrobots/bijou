// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// After "037 Shapes on a QuadTree" by Saneef Ansari (Observable), itself after George
// Francis's "Building Generative Grid Layouts With Quadtrees". The quadtree insert and
// split follow @timohausmann/quadtree-js 1.2.4 (MIT); the tree only makes the layout.
import { nextRandom } from '../random.js';

/** A rectangle in the unit square. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export type ShapeName = 'circle' | 'empty' | 'square' | 'forwardSlash' | 'backwardSlash';

/** One leaf quadrant of the tree, with its shape and its fill index into the palette's shape colours. */
export interface Leaf {
  readonly box: Box;
  readonly shape: ShapeName;
  readonly fill: number;
}

export interface Layout {
  readonly points: readonly Box[];
  readonly leaves: readonly Leaf[];
}

interface TreeNode {
  readonly box: Box;
  readonly level: number;
  objects: Box[];
  nodes: TreeNode[];
}

/** The original sizes each point 4 px on a page about 600 px wide. */
const POINT = 4 / 600;
const SHAPES: readonly ShapeName[] = ['circle', 'empty', 'square', 'forwardSlash', 'backwardSlash'];

/** Which quadrant wholly holds `r`: 0 top right, 1 top left, 2 bottom left, 3 bottom right, -1 when it straddles. */
function quadrantOf(node: TreeNode, r: Box): number {
  const midX = node.box.x + node.box.w / 2;
  const midY = node.box.y + node.box.h / 2;
  const top = r.y < midY && r.y + r.h < midY;
  const bottom = r.y > midY;
  if (r.x < midX && r.x + r.w < midX) return top ? 1 : bottom ? 2 : -1;
  if (r.x > midX) return top ? 0 : bottom ? 3 : -1;
  return -1;
}

function split(node: TreeNode): void {
  const { x, y } = node.box;
  const w = node.box.w / 2;
  const h = node.box.h / 2;
  const level = node.level + 1;
  const make = (bx: number, by: number): TreeNode => ({ box: { x: bx, y: by, w, h }, level, objects: [], nodes: [] });
  node.nodes = [make(x + w, y), make(x, y), make(x, y + h), make(x + w, y + h)];
}

function insert(node: TreeNode, r: Box, maxObjects: number, maxLevels: number): void {
  if (node.nodes.length > 0) {
    const child = node.nodes[quadrantOf(node, r)];
    if (child !== undefined) {
      insert(child, r, maxObjects, maxLevels);
      return;
    }
  }
  node.objects.push(r);
  if (node.objects.length <= maxObjects || node.level >= maxLevels) return;
  if (node.nodes.length === 0) split(node);
  const kept: Box[] = [];
  for (const object of node.objects) {
    const child = node.nodes[quadrantOf(node, object)];
    if (child === undefined) kept.push(object);
    else insert(child, object, maxObjects, maxLevels);
  }
  node.objects = kept;
}

function leavesOf(node: TreeNode): Box[] {
  return node.nodes.length === 0 ? [node.box] : node.nodes.flatMap(leavesOf);
}

export interface LayoutOptions {
  readonly points: number;
  readonly maxObjects: number;
  readonly maxLevels: number;
  /** How many shape colours the palette has. */
  readonly fills: number;
}

/** The original's points, quadtree and weighted shapes, from one seed. Returns the layout and the next seed. */
export function layout(seed: number, options: LayoutOptions): readonly [Layout, number] {
  let s = seed;
  const random = (): number => {
    const [value, next] = nextRandom(s);
    s = next;
    return value;
  };
  const rangeFloor = (max: number): number => Math.floor(random() * max);
  /** A value pulled towards `bias`, as the original's randomBias. */
  const biased = (bias: number, influence: number): number => {
    const base = random();
    const mix = random() * influence;
    return base * (1 - mix) + bias * mix;
  };
  const uFocus = random();
  const vFocus = random();
  const points: Box[] = Array.from({ length: options.points }, () => ({ x: biased(uFocus, 1), y: biased(vFocus, 1), w: POINT, h: POINT }));
  const slash = rangeFloor(100) / 2;
  const weights = [rangeFloor(100), rangeFloor(100), rangeFloor(100), slash, slash];
  const total = weights.reduce((a, b) => a + b, 0);
  const pickShape = (): ShapeName => {
    if (total <= 0) return 'square';
    let r = random() * total;
    for (let i = 0; i < weights.length; i += 1) {
      const weight = weights[i] ?? 0;
      if (r < weight) return SHAPES[i] ?? 'square';
      r -= weight;
    }
    return 'circle';
  };
  const root: TreeNode = { box: { x: 0, y: 0, w: 1, h: 1 }, level: 0, objects: [], nodes: [] };
  for (const p of points) insert(root, p, options.maxObjects, options.maxLevels);
  const leaves = leavesOf(root).map((box): Leaf => {
    const fill = rangeFloor(Math.max(1, options.fills));
    return { box, fill, shape: pickShape() };
  });
  return [{ points, leaves }, s];
}
