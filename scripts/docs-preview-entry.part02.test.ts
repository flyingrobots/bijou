import {
  afterEach,
  BIJOU_VERSION,
  createDocsApp,
  createTestContext,
  describe,
  expect,
  frameText,
  it,
  KEY_ENTER,
  runScript,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model).route).toBe('landing');

    const ignored = await runScript(app, [{ key: 'a' }], { ctx });
    expect((ignored.model).route).toBe('landing');
    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model).route).toBe('docs');
    const enteredFrame = must(entered.frames.at(-1));
    const enteredText = frameText(enteredFrame);
    expect(enteredText).toContain('Bijou Docs');
    expect(enteredText).toContain('Start Here');
    expect(enteredText).not.toContain('Press [Enter]');
    expect(enteredText).not.toContain('V7 Launch Wake');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('renders the landing page with the animated title treatment and minimal entry copy', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = must(initial.frames[0]);

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    const lines = text.split('\n');
    const footer = lines[frame.height - 1] ?? '';

    expect(text).toContain('Press [Enter]');
    expect(footer).toContain('Esc/q quit');
    expect(footer).toContain('↑/↓ quality');
    expect(footer).toContain('←/→ theme');
    expect(footer).toContain('Enter continue');
    expect(footer).toContain(`v${BIJOU_VERSION}`);
    expect(footer).toMatch(/\d+ fps • auto\/full/);
    expect(lines[0]).not.toMatch(/\d+ fps/);
    expect(text).not.toContain('Documentation coverage');
    expect(text).toContain('DOGFOOD');
    expect(text).toContain('Documentation Of Good');
    expect(text).toContain('V7 Launch Wake');
    expect(text).not.toContain('What is Bijou?');
    expect(text).not.toContain('How to use these docs');
    // Gradient background chars (█▓▒░·) require pulse-driven animation;
    // the initial frame without pulses may not contain them. The pulse
    // test below ('animates the landing title screen on pulse') covers this.
  });
});
