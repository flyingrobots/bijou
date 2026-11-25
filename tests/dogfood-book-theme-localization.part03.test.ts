import { afterEach, describe, it } from 'vitest';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import { casesOfPart, expectLocalized } from './dogfood-book-theme-localization.test-support.js';

afterEach(() => { _resetDefaultContextForTesting(); });

describe('book theme runtime localization', () => {
  it.each(casesOfPart(2))('localizes actual %s picker, mode descriptions, Theme Lab and Inspector', async (...row) => {
    await expectLocalized(...row);
  });
});
