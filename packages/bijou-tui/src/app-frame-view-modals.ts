import type { Overlay } from './overlay.js';
import { modal } from './overlay.js';
import type { InternalFrameModel } from './app-frame-types.js';
import type { FrameViewDependencies } from './app-frame-view-contract.js';
import type { renderFrameBase } from './app-frame-view-base.js';
import { commandPaletteSurface } from './command-palette.js';
import { frameMessage } from './app-frame-i18n.js';
import { renderHelpOverlay } from './app-frame-overlays.js';

export function collectFrameModalOverlays<PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
  dependencies: FrameViewDependencies<PageModel, Msg>,
  base: ReturnType<typeof renderFrameBase<PageModel, Msg>>,
): Overlay[] {
  const { options } = dependencies;
  const { activeLayer, controlProjection, themedContext } = base;
  const overlays: Overlay[] = [];
  if (model.helpOpen) {
    const helpSource = controlProjection.helpSource;
    if (helpSource == null) {
      throw new Error(
        'createFramedApp: help layer projection is missing a help source',
      );
    }
    const help = renderHelpOverlay(model, helpSource, options.i18n);
    overlays.push(
      modal({
        title:
          activeLayer.title ??
          frameMessage(options.i18n, 'help.title', 'Keyboard Help'),
        body: help.body,
        hint:
          typeof activeLayer.hintSource === 'string'
            ? activeLayer.hintSource
            : frameMessage(
                options.i18n,
                'help.hint',
                'j/k scroll • d/u page • g/G top/bottom • mouse wheel • ?/Esc close',
              ),
        borderToken: themedContext?.border('primary'),
        bgToken: themedContext?.surface('elevated'),
        ctx: themedContext,
        width: help.body.width + 4,
        screenWidth: model.columns,
        screenHeight: model.rows,
      }),
    );
  }
  if (model.commandPalette != null) {
    const width = Math.max(20, Math.min(80, model.columns - 4));
    const body = commandPaletteSurface(model.commandPalette, {
      width: Math.max(16, width - 4),
      ctx: themedContext,
      showScrollbar: false,
    });
    const layer =
      activeLayer.kind === 'search' ||
      activeLayer.kind === 'command-palette'
        ? activeLayer
        : undefined;
    overlays.push(
      modal({
        title:
          layer?.title ??
          model.commandPaletteTitle ??
          frameMessage(options.i18n, 'palette.title', 'Command Palette'),
        body,
        hint:
          typeof layer?.hintSource === 'string'
            ? layer.hintSource
            : frameMessage(
                options.i18n,
                'palette.hint',
                'Enter select • Esc close',
              ),
        borderToken: themedContext?.border('primary'),
        bgToken: themedContext?.surface('elevated'),
        ctx: themedContext,
        width,
        screenWidth: model.columns,
        screenHeight: model.rows,
      }),
    );
  }
  return overlays;
}
