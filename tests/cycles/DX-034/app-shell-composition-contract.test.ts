import { describe, expect, it } from 'vitest';
import {
  commandIntent,
  defineAppShellComposition,
  defineBlock,
  defineDataProvider,
  defineDataRequirement,
  defineViewData,
  provide,
  providerScope,
  type BlockMetadata,
} from '../../../packages/bijou/src/index.js';

describe('DX-034C AppShell composition contract', () => {
  it('keeps shell slots structural while data and commands remain inspectable contracts', () => {
    const article = defineDataRequirement({
      id: 'article',
      resource: 'docs.article',
    });
    const readerData = defineViewData({
      id: 'reader.data',
      requirements: [{ name: 'article', requirement: article }],
    });
    const openArticle = commandIntent<{ articleId: string }>('docs.openArticle');
    const reader = defineBlock({
      metadata: metadataFor('ReaderSurface'),
      data: readerData,
      commands: [openArticle],
      render: () => ({ output: 'reader' }),
    });
    const shellProviders = providerScope([
      provide(defineDataProvider({
        id: 'docs.articleProvider',
        resource: article.resource,
      })),
    ], { id: 'docs.shell.providers' });

    const shell = defineAppShellComposition({
      id: 'docs.shell',
      providers: shellProviders,
      slots: {
        content: reader,
      },
    });

    expect(shell.slotIds()).toEqual(['content']);
    expect(shell.slot('content')).toEqual([reader]);
    expect(shell.providerScope()).toBe(shellProviders);
    expect(shell.dataContracts()).toEqual([readerData]);
    expect(shell.commandIntents()).toEqual([openArticle]);
    expect('render' in shell).toBe(false);
    expect('subscribe' in shell).toBe(false);
    expect('refresh' in shell).toBe(false);
  });
});

function metadataFor(blockName: string): BlockMetadata {
  return {
    packageName: '@flyingrobots/bijou',
    blockName,
    family: 'content-reading',
    scale: 'section',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: {
      summary: `${blockName} test block.`,
    },
    slots: [{ id: 'content' }],
  };
}
