import { describe, it, expect } from 'vitest';
import { mouseMove, mousePress, mouseRelease, mouseWheel, runScript, sgrMouse } from './driver.js';
import type { App } from './types.js';
import { badge } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

describe('runScript', () => {
  it('builds mouse script steps', () => {
      expect(mouseMove(4, 2)).toEqual({
        mouse: {
          type: 'mouse',
          button: 'none',
          action: 'move',
          col: 4,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
      });
      expect(mouseMove(4, 2, { button: 'left', shift: true, delay: 12 })).toEqual({
        mouse: {
          type: 'mouse',
          button: 'left',
          action: 'move',
          col: 4,
          row: 2,
          shift: true,
          alt: false,
          ctrl: false,
        },
        delay: 12,
      });
      expect(mousePress('right', 6, 3, { alt: true }).mouse).toMatchObject({
        button: 'right',
        action: 'press',
        col: 6,
        row: 3,
        alt: true,
      });
      expect(mouseRelease('middle', 7, 4, { ctrl: true }).mouse).toMatchObject({
        button: 'middle',
        action: 'release',
        col: 7,
        row: 4,
        ctrl: true,
      });
      expect(mouseWheel('down', 8, 5).mouse).toMatchObject({
        button: 'none',
        action: 'scroll-down',
        col: 8,
        row: 5,
      });
      expect(mouseWheel('up', 8, 5).mouse).toMatchObject({
        button: 'none',
        action: 'scroll-up',
        col: 8,
        row: 5,
      });
    });

  it('builds mouse script steps from SGR sequences', () => {
      expect(sgrMouse('\x1b[<35;10;20M')).toEqual({
        mouse: {
          type: 'mouse',
          button: 'none',
          action: 'move',
          col: 9,
          row: 19,
          shift: false,
          alt: false,
          ctrl: false,
        },
      });
      expect(sgrMouse('\x1b[<0;2;3M', 5)).toEqual({
        mouse: {
          type: 'mouse',
          button: 'left',
          action: 'press',
          col: 1,
          row: 2,
          shift: false,
          alt: false,
          ctrl: false,
        },
        delay: 5,
      });
      expect(sgrMouse('\x1b[<0;2;3m').mouse).toMatchObject({
        button: 'left',
        action: 'release',
        col: 1,
        row: 2,
      });
      expect(sgrMouse('\x1b[<65;8;9M').mouse).toMatchObject({
        button: 'none',
        action: 'scroll-down',
        col: 7,
        row: 8,
      });
      expect(() => sgrMouse('not mouse')).toThrow('sgrMouse: invalid SGR mouse sequence');
    });

  it('installs the BCSS resolver when css is provided', async () => {
      const ctx = createTestContext({
        runtime: { columns: 40, rows: 8 },
      });
      const app: App<null> = {
        init: () => [null, []],
        update: (_msg, model) => [model, []],
        view: () => badge('Styled', { class: 'active', ctx }),
      };
      const result = await runScript(app, [], {
        ctx,
        css: `
          .active {
            color: #001122;
            background: #33aa44;
          }
        `,
      });
      const badgeCell = result.frames[0]?.get(1, 0);
      expect(badgeCell.fg).toBe('#001122');
      expect(badgeCell.bg).toBe('#33aa44');
    });
});
