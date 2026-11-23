import type { UiSceneLowerMode } from './ui-scene-lowering.js';

export const UI_SCENE_BROWSER_ENDPOINT_VERSION = 'ui-scene-browser/1' as const;

export type UiSceneBrowserEndpointVersion =
  typeof UI_SCENE_BROWSER_ENDPOINT_VERSION;

/** The `geordi-browser` target profile a scene declares. */
export interface UiSceneBrowserTargetProfile {
  readonly kind: 'geordi-browser';
  readonly width: number;
  readonly height: number;
  readonly requires?: readonly string[];
  readonly claims?: readonly string[];
}

export interface UiSceneBrowserAttribute {
  readonly name: string;
  readonly value: string;
}

/**
 * One element of the lowered tree. It is plain data: attributes keep their
 * emitted order, `text` comes before `children`, and nothing refers to a DOM.
 */
export interface UiSceneBrowserElement {
  readonly tag: 'div' | 'span';
  readonly attributes: readonly UiSceneBrowserAttribute[];
  readonly text?: string;
  readonly children: readonly UiSceneBrowserElement[];
}

export interface UiSceneBrowserLoweringOptions {
  readonly lowerMode?: UiSceneLowerMode;
  /** Hex colors by token name. A token without an entry gets no color. */
  readonly tokenColors?: Readonly<Record<string, string>>;
  readonly supportedRequirements?: readonly string[];
}

export interface UiSceneBrowserLowering {
  readonly endpoint: UiSceneBrowserEndpointVersion;
  readonly root: UiSceneBrowserElement;
  readonly markup: string;
  readonly targetProfile: UiSceneBrowserTargetProfile;
  readonly sceneHash: string;
  readonly markupHash: string;
}

/** The part of a host document that {@link UiSceneBrowserElement} needs. */
export interface UiSceneBrowserDocument<
  Node,
  Element extends Node & UiSceneBrowserDomElement<Node>,
> {
  createElement(tag: string): Element;
  createTextNode(data: string): Node;
}

export interface UiSceneBrowserDomElement<Node> {
  setAttribute(name: string, value: string): void;
  appendChild(child: Node): unknown;
}
