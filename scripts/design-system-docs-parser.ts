export interface FamilySection {
  readonly title: string;
  readonly lines: readonly string[];
}

export function parseFamilySections(
  markdown: string,
): readonly FamilySection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: FamilySection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = /^###\s+(.+)$/.exec(line);
    if (match) {
      if (currentTitle != null) {
        sections.push({ title: currentTitle, lines: currentLines });
      }
      const title = match[1];
      if (title === undefined) {
        throw new Error('Malformed component family heading');
      }
      currentTitle = title.trim();
      currentLines = [];
      continue;
    }

    if (currentTitle != null) {
      currentLines.push(line);
    }
  }

  if (currentTitle != null) {
    sections.push({ title: currentTitle, lines: currentLines });
  }

  return sections;
}
