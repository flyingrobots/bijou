import { CONTRAST_LUMINANCE_OFFSET } from './doctor.part01.js';
import type { ColorUse, ThemeContrastPair, ThemeDoctorIssue, ThemeTokenEntry } from './doctor.part01.js';
import { invalidColorIssue, isValidHexColor, normalizeColor, parseHexColor, relativeLuminance, roundRatio } from './doctor.part02.js';

export function themeContrastRatio(foreground: string, background: string): number | undefined {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (fg === undefined || bg === undefined) {
    return undefined;
  }

  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return roundRatio((lighter + CONTRAST_LUMINANCE_OFFSET) / (darker + CONTRAST_LUMINANCE_OFFSET));
}

function inspectResolvedContrast(
  foregroundPath: string,
  backgroundPath: string,
  foreground: string,
  background: string,
  minRatio: number,
  issues: ThemeDoctorIssue[],
): void {
  const ratio = themeContrastRatio(foreground, background);
  if (ratio === undefined || ratio >= minRatio) {
    return;
  }

  issues.push({
    severity: 'warning',
    kind: 'low-contrast',
    foregroundPath,
    backgroundPath,
    ratio,
    minRatio,
    message: `${foregroundPath}/${backgroundPath}: ${String(ratio)}<${String(minRatio)}`,
  });
}

function inspectToken(
  entry: ThemeTokenEntry,
  minRatio: number,
  issues: ThemeDoctorIssue[],
  colorUses: ColorUse[],
): void {
  if (!isValidHexColor(entry.token.hex)) {
    issues.push(invalidColorIssue(entry.path, entry.token.hex));
  } else {
    colorUses.push({ path: entry.path, color: normalizeColor(entry.token.hex) });
  }

  if (entry.token.bg === undefined) {
    return;
  }

  const bgPath = `${entry.path}.bg`;
  if (!isValidHexColor(entry.token.bg)) {
    issues.push(invalidColorIssue(bgPath, entry.token.bg));
    return;
  }

  colorUses.push({ path: bgPath, color: normalizeColor(entry.token.bg) });
  inspectResolvedContrast(entry.path, bgPath, entry.token.hex, entry.token.bg, minRatio, issues);
}

function missingTokenIssue(path: string): ThemeDoctorIssue {
  return {
    severity: 'error',
    kind: 'missing-token',
    path,
    message: `${path} is missing`,
  };
}

function inspectContrastPair(
  pair: ThemeContrastPair,
  colorByPath: ReadonlyMap<string, string>,
  fallbackMinRatio: number,
  issues: ThemeDoctorIssue[],
): void {
  const foreground = colorByPath.get(pair.foreground);
  const background = colorByPath.get(pair.background);
  if (foreground === undefined) {
    issues.push(missingTokenIssue(pair.foreground));
    return;
  }
  if (background === undefined) {
    issues.push(missingTokenIssue(pair.background));
    return;
  }

  inspectResolvedContrast(
    pair.foreground,
    pair.background,
    foreground,
    background,
    pair.minRatio ?? fallbackMinRatio,
    issues,
  );
}

export { inspectContrastPair, inspectToken };
