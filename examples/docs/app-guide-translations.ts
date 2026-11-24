import ARTICLES from './generated/guide-translations.json' with { type: 'json' };
import { stripMarkdownFrontmatter } from './app-markdown-text.js';

/**
 * Translated DOGFOOD articles: `content/i18n/<locale>/<guide id>.md`. A file may start with frontmatter carrying
 * `title:` and `summary:` lines; the rest is the article body. A guide with its own `localizedBody` keeps it.
 */
export interface GuideTranslation {
  readonly title?: string;
  readonly summary?: string;
  readonly body: string;
}

const articles: ReadonlyMap<string, string> = new Map(Object.entries(ARTICLES).map(([key, lines]) => [key, lines.join('\n')]));
const cache = new Map<string, GuideTranslation | null>();

function parse(raw: string): GuideTranslation {
  // An empty frontmatter block ("---" straight after "---") carries nothing; drop it before parsing.
  const text = raw.replace(/^\uFEFF?---\r?\n---[ \t]*(?:\r?\n|$)/, '');
  const front = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)?.[1] ?? '';
  const field = (name: string): string | undefined =>
    new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(front)?.[1]?.trim().replace(/^"(.*)"$/, '$1');
  const title = field('title');
  const summary = field('summary');
  return {
    ...(title === undefined ? {} : { title }),
    ...(summary === undefined ? {} : { summary }),
    body: stripMarkdownFrontmatter(text).trim(),
  };
}

/** The translation of a guide into a locale, or undefined when there is none. */
export function guideTranslation(guideId: string, locale: string | undefined): GuideTranslation | undefined {
  if (locale === undefined || locale === 'en' || !/^[a-z0-9-]+$/i.test(guideId)) return undefined;
  const key = `${locale}/${guideId}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached ?? undefined;
  const article = articles.get(key);
  const translation = article === undefined ? null : parse(article);
  cache.set(key, translation);
  return translation ?? undefined;
}
