import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { BIJOU_DARK, cloneContextWithTheme, type BijouContext } from '@flyingrobots/bijou';
import { createFramedApp, run } from '@flyingrobots/bijou-tui';
import { createLabPages, type LabModel, type LabMsg } from './lab-page.js';
import { LAB_SHELL_THEMES } from './lab-themes.js';
import { derivationSummary } from './panel-swatches.js';

/**
 * Bijou Theme Lab.
 *
 * A normal framed Bijou app whose only job is to make a theme visible: every
 * token as a swatch, the same components rendered under whichever preset is
 * active, and the measured contrast that decides if the palette is usable.
 *
 * Themes are supplied to the frame as shell themes, so switching one repaints
 * the chrome as well as the content. Press F2 for the theme picker.
 */
export function createThemeLab(initial: BijouContext = initDefaultContext()) {
  // Start on the first shell theme rather than whatever ambient preset the
  // environment resolved. Passing BIJOU_DARK by reference (not a clone) lets
  // the frame match it by identity and open with 'bijou:dark' already
  // selected, so the chrome and the panels agree from the first frame.
  let ctx = cloneContextWithTheme(initial, BIJOU_DARK);
  const getCtx = (): BijouContext => ctx;

  return createFramedApp<LabModel, LabMsg>({
    ctx,
    title: 'Bijou Theme Lab',
    pages: createLabPages(getCtx),
    shellThemes: LAB_SHELL_THEMES,
    enableCommandPalette: true,
    initialColumns: initial.runtime.columns,
    initialRows: initial.runtime.rows,
    onShellThemeChange: ({ ctx: next }) => {
      ctx = next;
    },
    // Plain text only: the frame sanitizes this line, so styled ANSI would
    // lose its escape prefix and render as literal control-code text.
    helpLineSource: () => {
      const theme = getCtx().theme.theme;
      return [
        `theme ${theme.name}`,
        derivationSummary(theme),
        'F2 themes',
        'Tab pane',
        '? help',
        'q quit',
      ].join('  ·  ');
    },
  });
}

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  await run(createThemeLab(ctx));
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
