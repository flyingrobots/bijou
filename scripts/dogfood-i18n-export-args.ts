export type DogfoodI18nExportFormat = 'csv' | 'tsv' | 'json';

export interface ParsedDogfoodI18nExportArgs {
  readonly locale?: string;
  readonly format: DogfoodI18nExportFormat;
  readonly out?: string;
  readonly bundle?: string;
  readonly coverage: boolean;
  readonly help: boolean;
}

export function dogfoodI18nExportUsage(): string {
  return [
    'Usage: npm run dogfood:i18n:export -- --locale <locale> [--format csv|tsv] [--out <dir>] [--bundle <path>]',
    '       npm run dogfood:i18n:export -- --format json [--bundle <path>]',
    '       npm run dogfood:i18n:export -- --coverage',
  ].join('\n');
}

export function parseDogfoodI18nExportArgs(
  args: readonly string[],
): ParsedDogfoodI18nExportArgs {
  let locale: string | undefined;
  let format: DogfoodI18nExportFormat = 'csv';
  let out: string | undefined;
  let bundle: string | undefined;
  let coverage = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--locale') {
      locale = requireArgument(args, index, '--locale');
      index += 1;
    } else if (argument === '--format') {
      const value = requireArgument(args, index, '--format');
      if (value !== 'csv' && value !== 'tsv' && value !== 'json') {
        throw new Error(`Unsupported i18n export format: ${value}`);
      }
      format = value;
      index += 1;
    } else if (argument === '--out') {
      out = requireArgument(args, index, '--out');
      index += 1;
    } else if (argument === '--bundle') {
      bundle = requireArgument(args, index, '--bundle');
      index += 1;
    } else if (argument === '--coverage') {
      coverage = true;
    } else if (argument === '--help' || argument === '-h') {
      help = true;
    } else {
      throw new Error(`Unknown i18n export argument: ${String(argument)}`);
    }
  }
  return { locale, format, out, bundle, coverage, help };
}

function requireArgument(
  args: readonly string[],
  index: number,
  name: string,
): string {
  const value = args[index + 1];
  if (value == null || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}
