export function renderNarrowReleaseTitle(
  input: {
    readonly title: string;
    readonly subtitle: string;
    readonly proofLanes: readonly string[];
    readonly gate: string;
    readonly motif: string | undefined;
  },
  width: number,
): string {
  const frameWidth = Math.max(1, Math.floor(width));
  if (frameWidth < 4) return fitLine(input.title, frameWidth);
  const contentWidth = Math.max(0, frameWidth - 4);
  return [
    labeledRule(' BIJOU DOGFOOD ', frameWidth),
    `| ${fitLine(input.title, contentWidth)} |`,
    `| ${fitLine(shortenSubtitle(input.subtitle), contentWidth)} |`,
    `| ${fitLine(`lanes: ${input.proofLanes.slice(0, 2).join(', ')}`, contentWidth)} |`,
    `| ${fitLine(input.gate.includes('closeout') ? 'gate: closeout' : input.gate, contentWidth)} |`,
    ...(input.motif == null
      ? []
      : [`| ${fitLine(shortenMotif(input.motif), contentWidth)} |`]),
    framedRule(frameWidth),
  ].join('\n');
}
export function labeledRule(label: string, width: number): string {
  if (width <= 0) return '';
  if (width === 1) return '+';
  const innerWidth = Math.max(0, width - 2);
  const text = label.slice(0, innerWidth);
  return `+${text}${'-'.repeat(Math.max(0, innerWidth - text.length))}+`;
}
export function framedRule(width: number): string {
  if (width <= 0) return '';
  if (width === 1) return '+';
  return `+${'-'.repeat(Math.max(0, width - 2))}+`;
}
export function shortenSubtitle(subtitle: string): string {
  if (subtitle.startsWith('Blocks prove')) return 'Blocks prove UX.';
  if (subtitle.startsWith('A released')) return 'Release trail.';
  return subtitle;
}
export function shortenMotif(motif: string): string {
  if (motif.startsWith('Wake lines')) return 'motif: wake lines';
  return `motif: ${motif}`;
}
export function fitLine(value: string, width: number): string {
  const text =
    value.length <= width ? value : value.slice(0, Math.max(0, width - 1));
  return text.padEnd(width);
}

export function renderWideReleaseTitle(input: {
  readonly title: string;
  readonly subtitle: string;
  readonly proofLanes: readonly string[];
  readonly gate: string;
  readonly motif: string | undefined;
  readonly navigation: readonly string[];
}): string {
  return [
    '+ BIJOU DOGFOOD -------------------------------------------+',
    `| ${fitLine(input.title, 55)} |`,
    `| ${fitLine(input.subtitle, 55)} |`,
    '|                                                          |',
    `| ${fitLine(`Proof lanes: ${input.proofLanes.join(' | ')}`, 55)} |`,
    `| ${fitLine(`Release gate: ${input.gate}`, 55)} |`,
    ...(input.motif == null
      ? []
      : [`| ${fitLine(`Motif: ${input.motif}`, 55)} |`]),
    '|                                                          |',
    `| ${fitLine(input.navigation.map((item) => `[${item}]`).join(' '), 55)} |`,
    '+----------------------------------------------------------+',
  ].join('\n');
}
