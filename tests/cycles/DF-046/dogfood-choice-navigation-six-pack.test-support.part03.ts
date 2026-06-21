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
    case 'SingleChoiceBlock':
      return {
        label: 'Output mode',
        options: ['interactive', 'pipe', 'accessible'],
        selected: 'pipe',
        mode: 'radio',
        validation: 'available',
      };
    case 'MultipleChoiceBlock':
      return {
        label: 'Release proof',
        checked: ['lint', 'tests'],
        unchecked: ['screenshots'],
        selected: 'lint; tests',
        validation: '2 of 3 complete',
      };
    case 'BinaryDecisionBlock':
      return {
        label: 'Merge gate',
        selected: 'yes',
        consequence: 'admin merge',
        confirmation: 'CI green',
        disabledReason: 'none',
      };
    case 'PeerNavigationBlock':
      return {
        previous: 'Architecture',
        current: 'Blocks',
        next: 'Method',
        route: 'docs/blocks',
        status: 'available',
      };
    case 'ProgressiveDisclosureBlock':
      return {
        label: 'Advanced options',
        state: 'closed',
        hiddenCount: 6,
        summary: '6 options hidden',
        details: ['debug traces', 'layout facts'],
      };
    case 'PathProgressBlock':
      return {
        path: ['Setup', 'Blocks', 'Preview'],
        current: 'Blocks',
        step: 2,
        total: 3,
        status: 'current',
      };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'SingleChoiceBlock':
      return 'Output mode';
    case 'MultipleChoiceBlock':
      return 'Release proof';
    case 'BinaryDecisionBlock':
      return 'Merge gate';
    case 'PeerNavigationBlock':
      return 'Blocks';
    case 'ProgressiveDisclosureBlock':
      return 'Advanced options';
    case 'PathProgressBlock':
      return 'Setup; Blocks; Preview';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix };
