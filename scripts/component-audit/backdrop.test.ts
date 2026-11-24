import { describe, expect, it } from 'vitest';
import { createSurface, type Surface } from '../../packages/bijou/src/index.js';
import { compositeSurface, modal } from '../../packages/bijou-tui/src/index.js';
import { STORY_MODAL } from '../../examples/docs/stories-story-modal.js';
import { colourFindings } from './checks.js';
import { renderCombo, THEMES } from './render.js';

// flyingrobots/bijou#581: a modal dims the page behind it on purpose. Those backdrop cells are not text the
// reader is asked to read, but the modal's own text, and anything drawn over the backdrop, still is.
const theme = THEMES[0] ?? { theme: 'book', scheme: 'dark' as const };
const LOW = { fg: '#444444', bg: '#333333' };

/** A one-row surface of `text` drawn in a colour pair far below 3:1. */
function lowContrastText(text: string, modifiers: string[] = []): Surface {
  const surface = createSurface(text.length, 1);
  for (let x = 0; x < text.length; x++) surface.set(x, 0, { char: text.charAt(x), ...LOW, modifiers });
  return surface;
}

/** The page a dialog dims: a full screen of readable words. */
function page(): Surface {
  const surface = createSurface(40, 10);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 40; x++) surface.set(x, y, { char: 'w', fg: '#ffffff', bg: '#000000' });
  return surface;
}

/** The contrast findings of a story whose only variant draws `draw()`, in `mode`. */
function contrastOf(draw: () => Surface, mode: 'interactive' | 'static' = 'interactive') {
  const story = { ...STORY_MODAL, variants: [{ id: 'probe', label: 'Probe', render: draw }] };
  return colourFindings(renderCombo({ story, variantIndex: 0, mode, ...theme })).filter((f) => f.rule === 'contrast');
}

describe('component audit: modal backdrops', () => {
  for (const variant of STORY_MODAL.variants) {
    for (const { theme: id, scheme } of THEMES) {
      it(`does not count the dimmed backdrop of modal/${variant.id} on ${id}-${scheme} as unreadable text`, () => {
        const story = STORY_MODAL;
        const variantIndex = story.variants.indexOf(variant);
        for (const mode of ['interactive', 'static'] as const) {
          const errors = colourFindings(renderCombo({ story, variantIndex, mode, theme: id, scheme }))
            .filter((f) => f.rule === 'contrast' && f.severity === 'error');
          expect(errors.map((f) => f.message)).toEqual([]);
        }
      });
    }
  }

  it('still reports low-contrast text inside a modal, dim or not', () => {
    for (const modifiers of [[], ['dim']]) {
      const findings = contrastOf(() => {
        const dialog = modal({ body: lowContrastText('unreadable', modifiers), screenWidth: 40, screenHeight: 10 });
        return compositeSurface(page(), [dialog], { dim: true });
      });
      expect(findings.some((f) => f.severity === 'error' && f.message.includes('#333333') && f.message.includes('10 cells'))).toBe(true);
    }
  });

  it('still reports low-contrast text in a component composited over a dimmed backdrop', () => {
    const findings = contrastOf(() => compositeSurface(page(), [{ content: '', surface: lowContrastText('toast', ['dim']), row: 2, col: 3 }], { dim: true }));
    expect(findings.some((f) => f.severity === 'error' && f.message.includes('over 5 cells'))).toBe(true);
  });

  it('still reports dim low-contrast text drawn without a dimming compositor', () => {
    const findings = contrastOf(() => {
      const surface = page();
      surface.blit(lowContrastText('hint', ['dim']), 0, 0);
      return surface;
    });
    expect(findings.some((f) => f.severity === 'error' && f.message.includes('over 4 cells'))).toBe(true);
  });
});
