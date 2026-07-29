import type { BijouContext } from '../../ports/context.js';
import { hyperlink } from './hyperlink.js';
import { renderByMode } from '../mode-render.js';
import { CODE_SPAN_PLACEHOLDER_RE } from './markdown-parse.part02.js';

/**
 * Shared implementation for plain/accessible inline markdown stripping.
 *
 * Replaces links using the provided replacer, strips bold/italic markers,
 * and isolates code spans from formatting passes.
 *
 * @param text - The inline text to strip.
 * @param linkReplacer - Replacement pattern or function for markdown links.
 * @returns The stripped inline text.
 */
function parseInlineStripped(
  text: string,
  linkReplacer: string,
): string {
  let result = text;

  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, linkReplacer);

  // Code: extract and replace with placeholders to isolate from bold/italic
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(code);
    return '\uE000C' + String(idx) + '\uE001';
  });

  // Bold: **text** → text
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');

  // Italic: *text* → text
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');

  result = result.replace(CODE_SPAN_PLACEHOLDER_RE, (_m, idx: string) => codeSpans[Number(idx)] ?? '');

  return result;
}

/**
 * Strip inline markdown syntax to plain text (pipe mode).
 *
 * Converts links to `text (url)` format and removes formatting markers.
 *
 * @param text - The inline text to parse.
 * @returns The plain-text inline text.
 */
function parseInlinePlain(text: string): string {
  return parseInlineStripped(text, '$1 ($2)');
}

/**
 * Render inline markdown with terminal styling (interactive/static mode).
 *
 * Processes links, code spans, bold, and italic with theme-based colors.
 *
 * @param text - The inline text to parse.
 * @param ctx - Bijou context for styling.
 * @returns The styled inline text.
 */
function parseInlineStyled(text: string, ctx: BijouContext): string {
  let result = text;

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText: string, url: string) => {
    return hyperlink(linkText, url, { ctx });
  });

  // Code spans: extract and replace with placeholders to isolate from bold/italic.
  // Limitation: does not handle escaped backticks (\`) or double-backtick spans (`` `code` ``).
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_m, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(ctx.style.styled(ctx.semantic('warning'), code));
    return '\uE000C' + String(idx) + '\uE001';
  });

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, (_m, bold: string) => {
    return ctx.style.bold(bold);
  });

  // Italic: *text* — runs after bold removal, so `**bold**` won't false-match.
  // The negative lookahead/lookbehind prevents matching the `**` delimiter itself.
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, italic: string) => {
    return ctx.style.styled(ctx.semantic('muted'), italic);
  });

  result = result.replace(CODE_SPAN_PLACEHOLDER_RE, (_m, idx: string) => codeSpans[Number(idx)] ?? '');

  return result;
}

/**
 * Parse inline markdown for screen-reader-friendly output (accessible mode).
 *
 * Prefixes links with `Link:` and strips formatting markers.
 *
 * @param text - The inline text to parse.
 * @returns The accessible inline text.
 */
function parseInlineAccessible(text: string): string {
  return parseInlineStripped(text, 'Link: $1 ($2)');
}

/**
 * Parse and render inline markdown syntax within a text fragment.
 *
 * Dispatches to mode-specific handlers for styled, plain, or accessible output.
 *
 * @param text - The inline text to parse.
 * @param ctx - Bijou context for styling.
 * @returns The rendered inline text.
 */
export function parseInline(text: string, ctx: BijouContext): string {
  return renderByMode(ctx.mode, {
    accessible: () => parseInlineAccessible(text),
    pipe: () => parseInlinePlain(text),
    interactive: () => parseInlineStyled(text, ctx),
  }, text);
}
