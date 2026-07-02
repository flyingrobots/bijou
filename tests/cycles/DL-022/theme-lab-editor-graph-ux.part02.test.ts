import { BIJOU_DARK } from '../../../packages/bijou/src/index.js';
import { themeLabGraphNodes } from '../../../examples/docs/app-theme-lab-graph.js';

import { describe, expect, it } from 'vitest';

describe('DL-022 Theme Lab editor graph UX dependents', () => {
  it('lists status semantic dependents in the Theme Lab graph', () => {
    const nodes = themeLabGraphNodes(BIJOU_DARK, BIJOU_DARK);
    const success = nodes.find((node) => node.path === 'status.success');
    const error = nodes.find((node) => node.path === 'status.error');

    expect(success?.edges).toContain('semantic.success');
    expect(success?.edges).toContain('border.success');
    expect(error?.edges).toContain('semantic.error');
    expect(error?.edges).toContain('border.error');
  });
});
