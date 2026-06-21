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
    case 'FramedGroupBlock':
      return {
        title: 'Release Checks',
        items: ['tests green', 'docs updated', 'PR linked'],
        selected: 'tests green',
        mode: 'review',
      };
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: 'Why this changed',
        steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
        evidence: 'DF-040 playback',
        decision: 'keep grouped proof visible',
        nextStep: 'open lower-mode output',
      };
    case 'FormattedDocumentBlock':
      return {
        heading: 'Blocks document',
        body: 'Use prose for persistent product truth.',
        callout: 'Lower modes keep the same heading and body facts.',
        code: 'block: FormattedDocumentBlock',
      };
    case 'LinkDestinationBlock':
      return {
        label: 'DOGFOOD.md',
        destination: 'docs/DOGFOOD.md',
        kind: 'docs',
        status: 'available',
      };
    case 'DividerBlock':
      return {
        label: 'Release Evidence',
        style: 'rule',
        density: 'compact',
      };
    case 'TextEntryBlock':
      return {
        field: 'Search docs',
        value: 'table',
        placeholder: 'type a query',
        validation: '4 results',
        results: 4,
      };
    default:
      throw new Error(`missing slots for ${blockName}`);
  }
}

function expectedNeedle(blockName: string): string {
  switch (blockName) {
    case 'FramedGroupBlock':
      return 'Release Checks';
    case 'ExplainabilityWalkthroughBlock':
      return 'Why this changed';
    case 'FormattedDocumentBlock':
      return 'Blocks document';
    case 'LinkDestinationBlock':
      return 'docs/DOGFOOD.md';
    case 'DividerBlock':
      return 'Release Evidence';
    case 'TextEntryBlock':
      return 'Search docs';
    default:
      throw new Error(`missing needle for ${blockName}`);
  }
}

export { commandPrefix, expectedNeedle, slotsFor, storyPrefix };
