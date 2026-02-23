export type LogoSize = 'small' | 'medium' | 'large';
export interface LogoResult {
    text: string;
    lines: number;
    width: number;
}
export interface LogoConstraints {
    maxWidth: number;
    maxHeight: number;
}
export interface LogoOptions {
    /** Fallback text when no logo files are found. Default: 'BIJOU'. */
    fallbackText?: string;
}
/** Choose a logo size bucket based on terminal dimensions. */
export declare function selectLogoSize(cols: number, rows: number): LogoSize;
/**
 * Read a random .txt logo from `{logosDir}/{family}/{size}/`.
 *
 * When `constraints` are provided, files that exceed the max dimensions
 * are filtered out. If nothing in the requested size fits, the loader
 * cascades down (large → medium → small) before falling back to the
 * configurable fallback text.
 */
export declare function loadRandomLogo(logosDir: string, family: string, size: LogoSize, constraints?: LogoConstraints, options?: LogoOptions): LogoResult;
//# sourceMappingURL=logo.d.ts.map