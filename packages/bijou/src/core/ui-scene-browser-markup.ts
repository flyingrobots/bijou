import type { UiSceneBrowserElement } from './ui-scene-browser-contract.js';

/** Serializes a lowered element tree to HTML markup without whitespace. */
export function renderUiSceneBrowserMarkup(
  element: UiSceneBrowserElement,
): string {
  const attributes = element.attributes
    .map((entry) => ` ${entry.name}="${escapeAttribute(entry.value)}"`)
    .join('');
  const text = element.text == null ? '' : escapeText(element.text);
  const children = element.children.map(renderUiSceneBrowserMarkup).join('');
  return `<${element.tag}${attributes}>${text}${children}</${element.tag}>`;
}

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;');
}
