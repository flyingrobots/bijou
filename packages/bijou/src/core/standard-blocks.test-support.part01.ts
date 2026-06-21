import type { BlockMetadata, BlockRenderResult } from './block-metadata.js';

function isSurfaceOutput(
  result: BlockRenderResult,
): result is BlockRenderResult<{ width: number; height: number; get(x: number, y: number): { char?: string } }> {
  const output = result.output;
  return Boolean(
    output
      && typeof output === 'object'
      && typeof (output as { width?: unknown }).width === 'number'
      && typeof (output as { height?: unknown }).height === 'number'
      && typeof (output as { get?: unknown }).get === 'function',
  );
}

function surfaceText(surface: { width: number; height: number; get(x: number, y: number): { char?: string } }): string {
  let text = '';
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      text += surface.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

function findCell(
  surface: { width: number; height: number; get(x: number, y: number): { char?: string } },
  char: string,
): { char?: string; fg?: string; bg?: string; modifiers?: readonly string[] } | undefined {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      if (cell.char === char) {
        return cell;
      }
    }
  }
  return undefined;
}

const spyMetadata: BlockMetadata = {
  packageName: '@flyingrobots/bijou',
  blockName: 'SpyNavigation',
  family: 'app-structure',
  scale: 'panel',
  modes: ['interactive', 'static', 'pipe', 'accessible'],
  docs: {
    summary: 'Test-only navigation block for introspection proof.',
  },
  slots: [{ id: 'content', required: true }],
};

export { findCell, isSurfaceOutput, spyMetadata, surfaceText };
