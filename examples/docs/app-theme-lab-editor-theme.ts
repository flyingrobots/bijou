import type {
  Theme,
  TokenValue,
} from '../../packages/bijou/src/index.js';

export function cloneThemeForThemeLabEditor(theme: Theme): Theme {
  return {
    name: draftThemeName(theme.name),
    semantic: {
      success: cloneToken(theme.semantic.success),
      error: cloneToken(theme.semantic.error),
      warning: cloneToken(theme.semantic.warning),
      info: cloneToken(theme.semantic.info),
      accent: cloneToken(theme.semantic.accent),
      muted: cloneToken(theme.semantic.muted),
      primary: cloneToken(theme.semantic.primary),
    },
    gradient: {
      brand: theme.gradient.brand.map((stop) => ({ pos: stop.pos, color: [...stop.color] })),
      progress: theme.gradient.progress.map((stop) => ({ pos: stop.pos, color: [...stop.color] })),
    },
    border: {
      primary: cloneToken(theme.border.primary),
      secondary: cloneToken(theme.border.secondary),
      success: cloneToken(theme.border.success),
      warning: cloneToken(theme.border.warning),
      error: cloneToken(theme.border.error),
      muted: cloneToken(theme.border.muted),
    },
    ui: {
      cursor: cloneToken(theme.ui.cursor),
      focusGutter: cloneToken(theme.ui.focusGutter),
      scrollThumb: cloneToken(theme.ui.scrollThumb),
      scrollTrack: cloneToken(theme.ui.scrollTrack),
      sectionHeader: cloneToken(theme.ui.sectionHeader),
      logo: cloneToken(theme.ui.logo),
      tableHeader: cloneToken(theme.ui.tableHeader),
      trackEmpty: cloneToken(theme.ui.trackEmpty),
    },
    status: {
      success: cloneToken(theme.status.success),
      error: cloneToken(theme.status.error),
      warning: cloneToken(theme.status.warning),
      info: cloneToken(theme.status.info),
      pending: cloneToken(theme.status.pending),
      active: cloneToken(theme.status.active),
      muted: cloneToken(theme.status.muted),
    },
    surface: {
      primary: cloneToken(theme.surface.primary),
      secondary: cloneToken(theme.surface.secondary),
      elevated: cloneToken(theme.surface.elevated),
      overlay: cloneToken(theme.surface.overlay),
      muted: cloneToken(theme.surface.muted),
    },
  };
}

function draftThemeName(name: string): string {
  return `${name.replace(/(?:-draft)+$/u, '')}-draft`;
}

function cloneToken(token: TokenValue): TokenValue {
  return {
    hex: token.hex,
    ...(token.bg === undefined ? {} : { bg: token.bg }),
    ...(token.modifiers === undefined ? {} : { modifiers: [...token.modifiers] }),
    ...(token.fgRGB === undefined ? {} : { fgRGB: [...token.fgRGB] }),
    ...(token.bgRGB === undefined ? {} : { bgRGB: [...token.bgRGB] }),
  };
}
