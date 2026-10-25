import { input, select, type BijouContext } from '@flyingrobots/bijou';
import { googleFamilies } from './google-fonts.js';
import { chooseGoogleFont } from './load-font.js';
import { MarkdownStyles, TEXT_ELEMENTS, isTextElement } from './markdown-styles.js';
import { TextStyle } from './text-style.js';

/** Reuse one downloaded catalog for every element edited during this run. */
export async function configureStyles(ctx: BijouContext, initial: MarkdownStyles): Promise<MarkdownStyles> {
  let styles = initial;
  let families: readonly string[] | undefined;
  for (;;) {
    const element = await select({
      title: 'Typography — choose an element to edit',
      options: [...TEXT_ELEMENTS.map((value) => ({
        label: styles.for(value).font === 'terminal' ? `${value}: normal terminal text`
          : `${value}: ${fontLabel(styles.for(value).font)}, ${String(styles.for(value).size)} px`, value,
      })), { label: 'Render document', value: 'done' }],
      defaultValue: 'done', ctx,
    });
    if (!isTextElement(element)) return styles;
    const current = styles.for(element);
    const source = await select({
      title: `Font for ${element}`,
      options: [
        { label: `Keep ${fontLabel(current.font)}`, value: 'keep' },
        { label: 'Choose from Google Fonts', value: 'google' },
        { label: 'Use a local TTF or OTF file', value: 'file' },
        { label: 'Use normal terminal text', value: 'terminal' },
      ], defaultValue: 'keep', ctx,
    });
    let font = current.font;
    if (source === 'google') {
      if (families === undefined) {
        ctx.io.write('Downloading the Google Fonts family list…\n');
        families = await googleFamilies();
      }
      font = `google:${await chooseGoogleFont(ctx, families)}`;
    } else if (source === 'file') {
      font = `file:${await input({ title: 'Font filepath', required: true, ctx })}`;
    } else if (source === 'terminal') font = 'terminal';
    if (font === 'terminal') {
      styles = styles.with(element, new TextStyle(font, current.size));
      continue;
    }
    const size = await input({ title: `Size for ${element} in pixels (4–256)`, defaultValue: String(current.size), ctx });
    styles = styles.with(element, new TextStyle(font, Number(size)));
  }
}

function fontLabel(font: string): string {
  if (font === 'default') return 'default font';
  if (font === 'terminal') return 'normal terminal text';
  return font.replace(/^(?:google|file):/u, '');
}
