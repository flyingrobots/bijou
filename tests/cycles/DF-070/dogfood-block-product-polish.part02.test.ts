import { describe, expect, it } from 'vitest';
import { settingsMenuBlock } from '../../../examples/docs/dogfood-blocks.js';

describe('DF-070 DOGFOOD block product polish', () => {
  it('renders concrete settings rows through SettingsMenuBlock', () => {
    const rendered = settingsMenuBlock.render({
      config: {
        sections: [
          {
            id: 'shell',
            title: 'Shell',
            rows: [{
              id: 'show-hints',
              label: 'Show hints',
              valueLabel: 'On',
              description: 'Display shell-owned help text.',
            }],
          },
          {
            id: 'localization',
            title: 'Localization',
            rows: [{
              id: 'preferred-language',
              label: 'Preferred language',
              valueLabel: 'English',
              description: 'Language used for DOGFOOD chrome.',
            }],
          },
        ],
      },
      mode: 'pipe',
    });
    const interactive = settingsMenuBlock.render({
      config: {
        sections: [
          {
            id: 'localization',
            title: 'Localization',
            rows: [{
              id: 'preferred-language',
              label: 'Preferred language',
              valueLabel: 'English',
              description: 'Language used for DOGFOOD chrome.',
            }],
          },
        ],
      },
      mode: 'interactive',
    });
    expect(rendered.output).toContain('Shell');
    expect(rendered.output).toContain('- Show hints: On');
    expect(rendered.output).toContain('Display shell-owned help text.');
    expect(rendered.output).toContain('Localization');
    expect(rendered.output).toContain('- Preferred language: English');
    expect(rendered.output).toContain('Language used for DOGFOOD chrome.');
    expect(interactive.output).toContain('Language used for DOGFOOD chrome.');
    expect(rendered.output).not.toContain('sections: 2');
  });
});
