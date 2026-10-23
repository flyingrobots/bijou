/** Anchors copied from the canonical teaching book's preamble.tex. */
export const BOOK_COLORS = Object.freeze({
  coral: '#f7685f', ink: '#2d2726', heading: '#83312c', muted: '#645452', panel: '#ffedeb',
});

/** Mode-specific companions preserve warm neutrals and separate status roles. */
export const BOOK_MODE_COLORS = Object.freeze({
  dark: Object.freeze({
    background: '#1c1716', secondary: BOOK_COLORS.ink, elevated: '#332a28',
    overlay: '#151211', surfaceMuted: '#231c1b',
    text: BOOK_COLORS.panel, muted: '#c4ada9', accent: BOOK_COLORS.coral,
    success: '#93cbb0', warning: '#e1b46b', error: '#ffa39a', info: '#c3b1e1', chrome: '#aa827a',
  }),
  light: Object.freeze({
    background: '#fff9f8', secondary: BOOK_COLORS.panel, elevated: '#ffffff',
    overlay: '#fff9f8', surfaceMuted: '#fbe6e3',
    text: BOOK_COLORS.ink, muted: BOOK_COLORS.muted, accent: BOOK_COLORS.heading,
    success: '#256849', warning: '#79500f', error: '#aa2f2e', info: '#654a87', chrome: '#98746d',
  }),
});
