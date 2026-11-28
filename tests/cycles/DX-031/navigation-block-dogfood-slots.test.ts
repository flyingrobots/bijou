import { describe, expect, it } from 'vitest';
import { createDocsLocaleLocalization } from '../../../examples/docs/app-locale-localization.js';
import { standardBlockExampleSlots } from '../../../examples/docs/app-standard-block-preview-data.js';
import { NAVIGATION_CASES } from '../../../packages/bijou/src/core/standard-blocks-navigation.test-support.js';

// The navigation block goldens (flyingrobots/bijou#938) live in the core package,
// which must not import DOGFOOD sources. This check holds their slots to the
// DOGFOOD Blocks page's English example slots, so the goldens draw what DOGFOOD shows.
describe('navigation block goldens use the DOGFOOD example slots', () => {
  const english = createDocsLocaleLocalization()('en');

  it.each(NAVIGATION_CASES.map((testCase) => [testCase.block.metadata.blockName, testCase.slots] as const))(
    '%s',
    (blockName, slots) => {
      expect(standardBlockExampleSlots(blockName, english)).toEqual(slots);
    },
  );
});
