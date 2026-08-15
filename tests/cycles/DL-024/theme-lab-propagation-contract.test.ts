import { describe, expect, it } from 'vitest';
import { BIJOU_DARK } from '@flyingrobots/bijou';
import { writeThemeLabEditableHex } from '../../../examples/docs/app-theme-lab-editor-write.js';

describe('Theme Lab propagation contract', () => {
  it('does not propagate edits along edges absent from the authoring graph', () => {
    const primaryEdited = writeThemeLabEditableHex(BIJOU_DARK, 'semantic.primary', '#123456');
    const borderEdited = writeThemeLabEditableHex(BIJOU_DARK, 'border.primary', '#654321');

    expect(primaryEdited.surface.primary).toEqual(BIJOU_DARK.surface.primary);
    expect(primaryEdited.ui.tableHeader).toEqual(BIJOU_DARK.ui.tableHeader);
    expect(borderEdited.ui.scrollThumb).toEqual(BIJOU_DARK.ui.scrollThumb);
  });
});
