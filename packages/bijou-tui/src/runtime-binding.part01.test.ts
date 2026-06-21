import { defineBindingLifecycleOwner, defineDataRequirement, defineViewData } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { createRuntimeViewStack, pushRuntimeView } from './runtime-engine.js';
import { collectRuntimeViewBindings, isRuntimeViewBindingSource, runtimeActiveBindingLayers, runtimeViewBindingSource } from './runtime-binding.js';

describe('runtime active binding collection', () => {
  it('collects declared bindings from active runtime view layers only', () => {
    const shellOwner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
    const helpOwner = defineBindingLifecycleOwner({ id: 'docs.help', kind: 'view' });
    const modalOwner = defineBindingLifecycleOwner({ id: 'docs.modal', kind: 'view' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const helpTopic = defineDataRequirement({ id: 'helpTopic', resource: 'docs.helpTopic' });
    const modalChoice = defineDataRequirement({ id: 'modalChoice', resource: 'docs.modalChoice' });
    const shellData = defineViewData({
      requirements: [{ name: 'article', requirement: article }],
    });
    const helpData = defineViewData({
      requirements: [{ name: 'helpTopic', requirement: helpTopic }],
    });
    const modalData = defineViewData({
      requirements: [{ name: 'modalChoice', requirement: modalChoice }],
    });
    const shellSource = runtimeViewBindingSource({
      owner: shellOwner,
      contract: shellData,
      providerIds: [{ requirementId: 'article', providerId: 'docs.articleProvider' }],
    });
    const helpSource = runtimeViewBindingSource({
      owner: helpOwner,
      contract: helpData,
    });
    const modalSource = runtimeViewBindingSource({
      owner: modalOwner,
      contract: modalData,
    });
    const passThroughStack = pushRuntimeView(createRuntimeViewStack({
      id: 'docs-shell',
      kind: 'app-shell',
      dismissible: false,
      blocksBelow: false,
      model: { bindingSources: [shellSource] },
    }), {
      id: 'help',
      kind: 'overlay',
      dismissible: true,
      blocksBelow: false,
      model: { bindingSources: [helpSource] },
    });
    const modalStack = pushRuntimeView(passThroughStack, {
      id: 'modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
      model: { bindingSources: [modalSource] },
    });

    const passThroughCollection = collectRuntimeViewBindings(passThroughStack);
    const modalCollection = collectRuntimeViewBindings(modalStack);

    expect(isRuntimeViewBindingSource(shellSource)).toBe(true);
    expect(runtimeActiveBindingLayers(passThroughStack).map((layer) => layer.id)).toEqual([
      'docs-shell',
      'help',
    ]);
    expect(passThroughCollection.entries().map((entry) => entry.requirement.id)).toEqual([
      'article',
      'helpTopic',
    ]);
    expect(passThroughCollection.get('docs.shell', 'article')?.providerId).toBe(
      'docs.articleProvider',
    );
    expect(runtimeActiveBindingLayers(modalStack).map((layer) => layer.id)).toEqual(['modal']);
    expect(modalCollection.entries().map((entry) => entry.requirement.id)).toEqual([
      'modalChoice',
    ]);
    expect(modalCollection.has('docs.shell', 'article')).toBe(false);
  });

  it('rejects loose runtime binding source objects before collection', () => {
    const owner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
    const req = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const data = defineViewData({ requirements: [{ name: 'article', requirement: req }] });
    const stack = { layers: [{
      id: 'docs-shell',
      kind: 'app-shell',
      dismissible: false,
      blocksBelow: false,
      model: { bindingSources: [{ owner, contract: data }] },
    }] };

    expect(() => { Reflect.apply(collectRuntimeViewBindings, undefined, [stack]); }).toThrow(
      'runtime binding collection: source at layer docs-shell index 0 was not created by runtimeViewBindingSource()',
    );
  });

  it('copies provider assignments before freezing a runtime binding source', () => {
    const owner = defineBindingLifecycleOwner({ id: 'docs.shell', kind: 'app-shell' });
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const data = defineViewData({
      requirements: [{ name: 'article', requirement: article }],
    });
    const assignment = {
      requirementId: 'article',
      providerId: 'docs.articleProvider',
    };
    const source = runtimeViewBindingSource({
      owner,
      contract: data,
      providerIds: [assignment],
    });
    assignment.providerId = 'docs.mutatedProvider';
    const stack = createRuntimeViewStack({
      id: 'docs-shell',
      kind: 'app-shell',
      dismissible: false,
      blocksBelow: false,
      model: { bindingSources: [source] },
    });

    expect(Object.isFrozen(source.providerIds)).toBe(true);
    expect(Object.isFrozen(source.providerIds?.[0])).toBe(true);
    expect(collectRuntimeViewBindings(stack).get('docs.shell', 'article')?.providerId).toBe(
      'docs.articleProvider',
    );
  });

  it('throws deterministic errors for non-object runtime binding source inputs', () => {
    expect(() => { Reflect.apply(runtimeViewBindingSource, undefined, [null]); }).toThrow(
      'runtime binding source: input must be an object',
    );
    expect(() => { Reflect.apply(runtimeViewBindingSource, undefined, [[]]); }).toThrow(
      'runtime binding source: input must be an object',
    );
  });
});
