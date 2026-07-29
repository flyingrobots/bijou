import type {
  ComponentStory,
  StoryProfilePreset,
  StoryVariant,
} from './protocol-types.js';

export function storyDocsMarkdown<State>(
  story: ComponentStory<State>,
  variant: StoryVariant<State>,
  preset: StoryProfilePreset,
): string {
  const lines: string[] = [
    `# ${story.title}`,
    '',
    story.docs.summary,
    '',
    '- **Family:** ' + story.family,
    '- **Package:** ' + `\`${story.package}\``,
    '- **Variant:** ' + variant.label,
    '- **Profile:** ' +
      `${preset.label} (\`${preset.mode}\`, ${String(preset.width)} cols)`,
  ];

  if (variant.description != null) {
    lines.push(`- **Variant focus:** ${variant.description}`);
  }

  lines.push(
    '',
    '## Use when',
    '',
    ...toMarkdownList(story.docs.useWhen),
    '',
    '## Avoid when',
    '',
    ...toMarkdownList(story.docs.avoidWhen),
    '',
    '## Graceful lowering',
    '',
    `- **Interactive:** ${story.docs.gracefulLowering.interactive}`,
    `- **Static:** ${story.docs.gracefulLowering.static}`,
    `- **Pipe:** ${story.docs.gracefulLowering.pipe}`,
    `- **Accessible:** ${story.docs.gracefulLowering.accessible}`,
    '',
    '## Related families',
    '',
    ...toMarkdownList(
      story.docs.relatedFamilies.map((family) => `\`${family}\``),
    ),
  );

  if (story.source?.examplePath != null || story.source?.snippetLabel != null) {
    lines.push('', '## Source', '');
    if (story.source.examplePath != null) {
      lines.push(`- Example: \`${story.source.examplePath}\``);
    }
    if (story.source.snippetLabel != null) {
      lines.push(`- Snippet label: ${story.source.snippetLabel}`);
    }
  }

  return lines.join('\n');
}

function toMarkdownList(items: readonly string[]): string[] {
  return items.map((item) => `- ${item}`);
}
