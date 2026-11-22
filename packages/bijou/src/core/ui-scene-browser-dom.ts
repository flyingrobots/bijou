import type {
  UiSceneBrowserDocument,
  UiSceneBrowserDomElement,
  UiSceneBrowserElement,
} from './ui-scene-browser-contract.js';

/**
 * Builds a lowered element tree through a host document and returns the
 * detached root element. The host decides where to attach it.
 */
export function createUiSceneBrowserDom<
  Node,
  Element extends Node & UiSceneBrowserDomElement<Node>,
>(
  element: UiSceneBrowserElement,
  document: UiSceneBrowserDocument<Node, Element>,
): Element {
  const created = document.createElement(element.tag);
  for (const attribute of element.attributes) {
    created.setAttribute(attribute.name, attribute.value);
  }
  if (element.text != null) {
    created.appendChild(document.createTextNode(element.text));
  }
  for (const child of element.children) {
    created.appendChild(createUiSceneBrowserDom(child, document));
  }
  return created;
}
