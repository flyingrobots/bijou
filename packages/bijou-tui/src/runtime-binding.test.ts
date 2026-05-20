import {
  commandIntent,
  defineBindingLifecycleOwner,
  defineDataRequirement,
  defineViewData,
} from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import {
  applyRuntimeCommandBuffer,
  createRuntimeCommandBuffer,
  createRuntimeViewStack,
  pushRuntimeView,
} from './runtime-engine.js';
import {
  collectRuntimeViewBindings,
  dispatchRuntimeCommandIntent,
  isRuntimeCommandIntentEmission,
  isRuntimeViewBindingSource,
  runtimeActiveBindingLayers,
  runtimeCommandIntentEmission,
  runtimeCommandIntentRoute,
  runtimeViewBindingSource,
  type RuntimeViewBindingSource,
} from './runtime-binding.js';

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
      blocksBelow: true,
      model: { bindingSources: [helpSource] },
    });
    const modalStack = pushRuntimeView(passThroughStack, {
      id: 'modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: false,
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
    const article = defineDataRequirement({ id: 'article', resource: 'docs.article' });
    const data = defineViewData({
      requirements: [{ name: 'article', requirement: article }],
    });
    const stack = createRuntimeViewStack({
      id: 'docs-shell',
      kind: 'app-shell',
      dismissible: false,
      blocksBelow: false,
      model: {
        bindingSources: [{
          owner,
          contract: data,
        } as unknown as RuntimeViewBindingSource],
      },
    });

    expect(() => collectRuntimeViewBindings(stack)).toThrow(
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
    expect(() => runtimeViewBindingSource(null as never)).toThrow(
      'runtime binding source: input must be an object',
    );
    expect(() => runtimeViewBindingSource([] as never)).toThrow(
      'runtime binding source: input must be an object',
    );
  });
});

describe('runtime command intent dispatch proof', () => {
  it('buffers command intent emissions without executing business logic in the view', () => {
    type Command = { readonly type: 'reader.selectHeading'; readonly headingId: string };
    const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
    const selectHeading = commandIntent<{ readonly headingId: string }>('reader.selectHeading');
    const emission = runtimeCommandIntentEmission(selectHeading, {
      headingId: 'intro',
    }, { owner });
    const route = runtimeCommandIntentRoute<{ readonly headingId: string }, Command>({
      intent: selectHeading,
      toCommand: (intentEmission) => ({
        type: 'reader.selectHeading',
        headingId: intentEmission.payload.headingId,
      }),
    });

    const dispatched = dispatchRuntimeCommandIntent({
      emission,
      routes: [route],
      buffer: createRuntimeCommandBuffer<Command>(),
    });
    const applied = applyRuntimeCommandBuffer(
      { selectedHeadingId: '' },
      dispatched.buffer,
      (state, command) => ({
        selectedHeadingId: command.headingId,
      }),
    );

    expect(isRuntimeCommandIntentEmission(emission)).toBe(true);
    expect(Object.isFrozen(emission)).toBe(true);
    expect(emission.intent.id).toBe('reader.selectHeading');
    expect(dispatched.command).toEqual({
      type: 'reader.selectHeading',
      headingId: 'intro',
    });
    expect(dispatched.buffer.items).toEqual([{
      type: 'reader.selectHeading',
      headingId: 'intro',
    }]);
    expect(applied.state.selectedHeadingId).toBe('intro');
    expect(applied.buffer.items).toEqual([]);
    expect('provider' in emission).toBe(false);
    expect('refresh' in emission).toBe(false);
    expect('subscribe' in emission).toBe(false);
    expect('dispatch' in emission).toBe(false);
    expect('handle' in emission).toBe(false);
  });

  it('rejects command intent emissions without an explicit runtime route', () => {
    const intent = commandIntent('reader.refreshRequested');
    const emission = runtimeCommandIntentEmission(intent);

    expect(() => dispatchRuntimeCommandIntent({
      emission,
      routes: [],
      buffer: createRuntimeCommandBuffer(),
    })).toThrow(
      'runtime command intent dispatch: no route for intent reader.refreshRequested',
    );
  });

  it('copies and freezes command intent payloads before routing', () => {
    type Payload = { readonly heading: { readonly id: string } };
    type Command = { readonly type: 'reader.selectHeading'; readonly headingId: string };
    const selectHeading = commandIntent<Payload>('reader.selectHeading');
    const payload = { heading: { id: 'intro' } };
    const emission = runtimeCommandIntentEmission(selectHeading, payload);
    const route = runtimeCommandIntentRoute<Payload, Command>({
      intent: selectHeading,
      toCommand: (intentEmission) => ({
        type: 'reader.selectHeading',
        headingId: intentEmission.payload.heading.id,
      }),
    });
    payload.heading.id = 'mutated';

    const dispatched = dispatchRuntimeCommandIntent({
      emission,
      routes: [route],
      buffer: createRuntimeCommandBuffer<Command>(),
    });

    expect(Object.isFrozen(emission.payload)).toBe(true);
    expect(Object.isFrozen(emission.payload.heading)).toBe(true);
    expect(dispatched.command.headingId).toBe('intro');
  });

  it('throws deterministic errors for non-object command routing inputs', () => {
    const intent = commandIntent('reader.refreshRequested');

    expect(() => runtimeCommandIntentEmission(
      intent,
      undefined,
      null as never,
    )).toThrow('runtime command intent emission: options must be an object');
    expect(() => runtimeCommandIntentRoute(null as never)).toThrow(
      'runtime command intent route: input must be an object',
    );
    expect(() => dispatchRuntimeCommandIntent(null as never)).toThrow(
      'runtime command intent dispatch: input must be an object',
    );
  });
});
