import type { SemanticSceneApp } from '@flyingrobots/bijou-tui';
import type { BijouDomElement, BijouDomHandle, MountBijouDomOptions } from './dom-contract.js';

/**
 * Mount a semantic scene app into a DOM container.
 *
 * Not implemented yet: the tests for flyingrobots/bijou#796 come first.
 */
export function mountBijouDom<Model, M>(
  app: SemanticSceneApp<Model, M>,
  container: BijouDomElement,
  options: MountBijouDomOptions<Model> = {},
): BijouDomHandle<Model, M> {
  void app;
  void container;
  void options;
  throw new Error('mountBijouDom() is not implemented');
}
