import { readMarkdownDoc } from './app-markdown.js';
import { releaseLineOf } from './app-release-line.js';

const CHANGELOG_BOUNDARY_MARKER = '{{CHANGELOG_VERSION_BOUNDARIES}}';
const CHANGELOG_VERSION_HEADING = /^## \[([^\]]+)\](?:\s+[-\u2014]\s+(.+))?\s*$/gm;

export function renderReleaseStoryMarkdown(markdown: string, version: string): string {
  const current = markdown
    .replaceAll('{{RELEASE_VERSION}}', version)
    .replaceAll('{{RELEASE_LINE}}', releaseLineOf(version));
  if (!current.includes(CHANGELOG_BOUNDARY_MARKER)) return current;
  return current.replaceAll(CHANGELOG_BOUNDARY_MARKER, changelogVersionBoundariesMarkdown());
}

function changelogVersionBoundariesMarkdown(): string {
  const boundaries: string[] = [];
  const changelog = readMarkdownDoc('../../docs/CHANGELOG.md');
  for (const match of changelog.matchAll(CHANGELOG_VERSION_HEADING)) {
    const version = match[1];
    if (version == null) continue;
    const suffix = match[2]?.trim();
    boundaries.push(`- [${version}]${suffix == null || suffix.length === 0 ? '' : ` - ${suffix}`}`);
  }
  return boundaries.join('\n');
}
