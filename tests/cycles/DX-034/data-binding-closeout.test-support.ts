import { describe, expect, it } from 'vitest';
import {
  activeBindingCollection,
  activeBindingEntry,
  appShellBlock,
  bindingFrameUpdateFromSnapshots,
  bindingSnapshot,
  defineAppShellComposition,
  defineBindingLifecycleOwner,
  defineDataProvider,
  defineDataRequirement,
  inspectorPanelBlock,
  provide,
  providerScope,
  readerSurfaceBlock,
  standardBlockStories,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';
interface ArticleData {
  readonly body: string;
  readonly outline: readonly string[];
}
interface InspectorData {
  readonly selection: string;
  readonly details: readonly string[];
}
function sectionBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}
export {
  activeBindingCollection,
  activeBindingEntry,
  appShellBlock,
  bindingFrameUpdateFromSnapshots,
  bindingSnapshot,
  defineAppShellComposition,
  defineBindingLifecycleOwner,
  defineDataProvider,
  defineDataRequirement,
  describe,
  expect,
  inspectorPanelBlock,
  it,
  provide,
  providerScope,
  readerSurfaceBlock,
  readRepoFile,
  sectionBetween,
  standardBlockStories,
};
export type { ArticleData, InspectorData };
