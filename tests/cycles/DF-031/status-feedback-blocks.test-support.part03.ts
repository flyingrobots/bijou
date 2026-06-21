function storyPrefix(blockName: string): string {
  return blockName
    .replace(/Block$/, '')
    .replace(
      /[A-Z]/g,
      (letter, index) => `${index === 0 ? '' : '-'}${letter.toLowerCase()}`,
    );
}

function commandPrefix(blockName: string): string {
  const withoutBlock = blockName.replace(/Block$/, '');
  return withoutBlock.charAt(0).toLowerCase() + withoutBlock.slice(1);
}

function slotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'InlineStatusBlock':
      return { label: 'docs', status: 'ok', message: 'synced' };
    case 'InFlowStatusBlock':
      return {
        severity: 'warning',
        source: 'docs',
        message: 'inventory stale',
        action: 'run docs:inventory',
      };
    case 'TransientOverlayBlock':
      return {
        priority: 'normal',
        message: 'Saved DOGFOOD route',
        dismiss: 'Esc dismisses',
      };
    case 'ActivityStreamBlock':
      return {
        events: ['10:41 tests passed', '10:42 PR opened'],
        selected: '10:41 tests passed',
      };
    case 'ShortcutCueBlock':
      return { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' };
    case 'ProgressIndicatorBlock':
      return { label: 'Install packages', value: '3', total: '5', percent: '60%' };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'InlineStatusBlock':
      return 'docs';
    case 'InFlowStatusBlock':
      return 'inventory stale';
    case 'TransientOverlayBlock':
      return 'Saved DOGFOOD route';
    case 'ActivityStreamBlock':
      return '10:41 tests passed';
    case 'ShortcutCueBlock':
      return '/ Search';
    case 'ProgressIndicatorBlock':
      return 'Install packages';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

function primarySemanticSlot(blockName: string): string {
  switch (blockName) {
    case 'InlineStatusBlock':
      return 'label';
    case 'InFlowStatusBlock':
      return 'message';
    case 'TransientOverlayBlock':
      return 'message';
    case 'ActivityStreamBlock':
      return 'events';
    case 'ShortcutCueBlock':
      return 'shortcuts';
    case 'ProgressIndicatorBlock':
      return 'label';
    default:
      throw new Error(`missing semantic slot for ${blockName}`);
  }
}

function primarySemanticValue(blockName: string): string {
  switch (blockName) {
    case 'ActivityStreamBlock':
      return '10:41 tests passed; 10:42 PR opened';
    case 'ShortcutCueBlock':
      return '/ Search; ? Help; Esc Close';
    default:
      return expectedNeedle(blockName);
  }
}

export {
  commandPrefix,
  expectedNeedle,
  primarySemanticSlot,
  primarySemanticValue,
  slotsFor,
  storyPrefix,
};
