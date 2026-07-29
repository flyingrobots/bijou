import type { Theme } from './tokens.js';
import { DEFAULT_MIN_CONTRAST_RATIO, MIN_REUSE_LIMIT } from './doctor.part01.js';
import type { ColorUse, ThemeDoctorIssue, ThemeDoctorOptions, ThemeDoctorReport } from './doctor.part01.js';
import { collectThemeColorEntries, collectThemeTokens } from './doctor.part02.js';
import { inspectContrastPair, inspectToken } from './doctor.part03.js';

function inspectColorReuse(
  colorUses: readonly ColorUse[],
  maxColorReuse: number | undefined,
  issues: ThemeDoctorIssue[],
): void {
  if (maxColorReuse === undefined || maxColorReuse < MIN_REUSE_LIMIT) {
    return;
  }

  const usesByColor = new Map<string, string[]>();
  for (const use of colorUses) {
    const paths = usesByColor.get(use.color) ?? [];
    paths.push(use.path);
    usesByColor.set(use.color, paths);
  }

  for (const [color, paths] of usesByColor) {
    if (paths.length <= maxColorReuse) {
      continue;
    }

    issues.push({
      severity: 'warning',
      kind: 'color-reuse',
      color,
      limit: maxColorReuse,
      count: paths.length,
      paths,
      message: `${color} reuse ${String(paths.length)}>${String(maxColorReuse)}`,
    });
  }
}

export function doctorTheme(theme: Theme, options: ThemeDoctorOptions = {}): ThemeDoctorReport {
  const entries = collectThemeTokens(theme);
  const colorByPath = new Map(collectThemeColorEntries(entries).map((entry) => [entry.path, entry.color]));
  const issues: ThemeDoctorIssue[] = [];
  const colorUses: ColorUse[] = [];

  for (const entry of entries) {
    inspectToken(entry, options.minContrastRatio ?? DEFAULT_MIN_CONTRAST_RATIO, issues, colorUses);
  }

  for (const pair of options.contrastPairs ?? []) {
    inspectContrastPair(pair, colorByPath, options.minContrastRatio ?? DEFAULT_MIN_CONTRAST_RATIO, issues);
  }

  inspectColorReuse(colorUses, options.maxColorReuse, issues);

  return {
    themeName: theme.name,
    passed: issues.length === 0,
    checkedTokenCount: entries.length,
    issues,
  };
}
