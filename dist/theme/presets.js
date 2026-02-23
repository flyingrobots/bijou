/** Helper to reduce verbosity when defining token values. */
function tv(hex, modifiers) {
    return modifiers !== undefined ? { hex, modifiers } : { hex };
}
/**
 * CYAN_MAGENTA — the default theme.
 *
 * Named ANSI → hex mapping used here:
 *   green   = #00ff00    cyan    = #00ffff    magenta = #ff00ff
 *   red     = #ff0000    yellow  = #ffff00    blue    = #0000ff
 *   gray    = #808080    white   = #ffffff
 */
export const CYAN_MAGENTA = {
    name: 'cyan-magenta',
    status: {
        success: tv('#00ff00'),
        error: tv('#ff0000'),
        warning: tv('#ffff00'),
        info: tv('#00ffff'),
        pending: tv('#808080', ['dim']),
        active: tv('#00ffff'),
        muted: tv('#808080', ['dim', 'strikethrough']),
    },
    semantic: {
        success: tv('#00ff00'),
        error: tv('#ff0000'),
        warning: tv('#ffff00'),
        info: tv('#00ffff'),
        accent: tv('#ff00ff'),
        muted: tv('#808080', ['dim']),
        primary: tv('#ffffff', ['bold']),
    },
    gradient: {
        brand: [
            { pos: 0, color: [0, 255, 255] },
            { pos: 1, color: [255, 0, 255] },
        ],
        progress: [
            { pos: 0, color: [0, 255, 255] },
            { pos: 1, color: [255, 0, 255] },
        ],
    },
    border: {
        primary: tv('#00ffff'),
        secondary: tv('#ff00ff'),
        success: tv('#00ff00'),
        warning: tv('#ffff00'),
        error: tv('#ff0000'),
        muted: tv('#808080'),
    },
    ui: {
        cursor: tv('#00ffff'),
        scrollThumb: tv('#00ffff'),
        scrollTrack: tv('#808080'),
        sectionHeader: tv('#0000ff', ['bold']),
        logo: tv('#00ffff'),
        tableHeader: tv('#ffffff'),
        trackEmpty: tv('#505050'),
    },
};
/**
 * TEAL_ORANGE_PINK — a gradient-based theme.
 *
 * Uses the gradient colors (#3bcfd4 → #fc9305 → #f20094) as the
 * foundation, with harmonized status/semantic tokens.
 */
export const TEAL_ORANGE_PINK = {
    name: 'teal-orange-pink',
    status: {
        success: tv('#34d399'),
        error: tv('#ef4444'),
        warning: tv('#fc9305'),
        info: tv('#3bcfd4'),
        pending: tv('#6b7280', ['dim']),
        active: tv('#3bcfd4'),
        muted: tv('#6b7280', ['dim', 'strikethrough']),
    },
    semantic: {
        success: tv('#34d399'),
        error: tv('#ef4444'),
        warning: tv('#fc9305'),
        info: tv('#3bcfd4'),
        accent: tv('#f20094'),
        muted: tv('#6b7280', ['dim']),
        primary: tv('#d1d5db', ['bold']),
    },
    gradient: {
        brand: [
            { pos: 0, color: [0x3b, 0xcf, 0xd4] },
            { pos: 0.5, color: [0xfc, 0x93, 0x05] },
            { pos: 1, color: [0xf2, 0x00, 0x94] },
        ],
        progress: [
            { pos: 0, color: [0x3b, 0xcf, 0xd4] },
            { pos: 0.5, color: [0xfc, 0x93, 0x05] },
            { pos: 1, color: [0xf2, 0x00, 0x94] },
        ],
    },
    border: {
        primary: tv('#3bcfd4'),
        secondary: tv('#f20094'),
        success: tv('#34d399'),
        warning: tv('#fc9305'),
        error: tv('#ef4444'),
        muted: tv('#6b7280'),
    },
    ui: {
        cursor: tv('#3bcfd4'),
        scrollThumb: tv('#3bcfd4'),
        scrollTrack: tv('#6b7280'),
        sectionHeader: tv('#fc9305', ['bold']),
        logo: tv('#3bcfd4'),
        tableHeader: tv('#d1d5db'),
        trackEmpty: tv('#404040'),
    },
};
/** Registry of all built-in presets, keyed by theme name. */
export const PRESETS = {
    'cyan-magenta': CYAN_MAGENTA,
    'teal-orange-pink': TEAL_ORANGE_PINK,
};
//# sourceMappingURL=presets.js.map