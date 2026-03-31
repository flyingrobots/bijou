import { describe, expect, it } from 'vitest';
import {
  activeRuntimeView,
  clearRuntimeViewsToRoot,
  createRuntimeStateMachine,
  createRuntimeViewStack,
  popRuntimeView,
  pushRuntimeView,
  replaceRuntimeRootView,
  replaceTopRuntimeView,
  transitionRuntimeState,
} from './runtime-engine.js';

describe('runtime state machine', () => {
  it('tracks current and previous state across explicit transitions', () => {
    const machine = createRuntimeStateMachine({
      id: 'session.active',
      sessionId: 'abc',
    });

    const next = transitionRuntimeState(machine, {
      id: 'session.ended',
      sessionId: 'abc',
    });

    expect(machine.current.id).toBe('session.active');
    expect(machine.previous).toBeUndefined();
    expect(next.current.id).toBe('session.ended');
    expect(next.previous?.id).toBe('session.active');
    expect(next.transitionCount).toBe(1);
  });
});

describe('runtime view stack', () => {
  it('requires a non-dismissible root view', () => {
    expect(() => createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: true,
      blocksBelow: false,
    })).toThrow(/root view/i);
  });

  it('creates a first-class root view and exposes the active runtime view', () => {
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    expect(stack.layers).toHaveLength(1);
    expect(stack.layers[0]).toMatchObject({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      root: true,
    });
    expect(activeRuntimeView(stack)?.id).toBe('workspace');
  });

  it('pushes overlays without altering the state-machine state', () => {
    const machine = createRuntimeStateMachine({
      id: 'docs.browsing',
      storyId: 'alert',
    });
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    const nextStack = pushRuntimeView(stack, {
      id: 'confirm-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    expect(machine.current.id).toBe('docs.browsing');
    expect(nextStack.layers.map((layer) => layer.id)).toEqual(['workspace', 'confirm-modal']);
    expect(activeRuntimeView(nextStack)?.id).toBe('confirm-modal');
  });

  it('never pops the root view', () => {
    const baseOnly = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });
    const poppedBaseOnly = popRuntimeView(baseOnly);

    expect(poppedBaseOnly.popped).toBeUndefined();
    expect(poppedBaseOnly.stack.layers).toHaveLength(1);

    const stacked = pushRuntimeView(baseOnly, {
      id: 'help',
      kind: 'help',
      dismissible: true,
      blocksBelow: true,
    });
    const poppedOverlay = popRuntimeView(stacked);

    expect(poppedOverlay.popped?.id).toBe('help');
    expect(poppedOverlay.stack.layers.map((layer) => layer.id)).toEqual(['workspace']);
  });

  it('replaces the top view without rewriting the root view', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'confirm-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    const next = replaceTopRuntimeView(stack, {
      id: 'search',
      kind: 'search',
      dismissible: true,
      blocksBelow: true,
    });

    expect(next.layers.map((layer) => layer.id)).toEqual(['workspace', 'search']);
    expect(next.layers[0]?.root).toBe(true);
  });

  it('does not allow replace-top to rewrite the root view accidentally', () => {
    const stack = createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    });

    expect(() => replaceTopRuntimeView(stack, {
      id: 'summary',
      kind: 'summary',
      dismissible: false,
      blocksBelow: false,
    })).toThrow(/root view/i);
  });

  it('clears back to the root view without deleting it', () => {
    const stack = pushRuntimeView(pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'search',
      kind: 'search',
      dismissible: true,
      blocksBelow: true,
    }), {
      id: 'help',
      kind: 'help',
      dismissible: true,
      blocksBelow: true,
    });

    const cleared = clearRuntimeViewsToRoot(stack);
    expect(cleared.layers.map((layer) => layer.id)).toEqual(['workspace']);
    expect(cleared.layers[0]?.root).toBe(true);
  });

  it('replaces the root view explicitly while preserving overlays above it', () => {
    const stack = pushRuntimeView(createRuntimeViewStack({
      id: 'workspace',
      kind: 'workspace',
      dismissible: false,
      blocksBelow: false,
    }), {
      id: 'summary-modal',
      kind: 'modal',
      dismissible: true,
      blocksBelow: true,
    });

    const next = replaceRuntimeRootView(stack, {
      id: 'post-session',
      kind: 'summary',
      dismissible: false,
      blocksBelow: false,
    });

    expect(next.layers.map((layer) => layer.id)).toEqual(['post-session', 'summary-modal']);
    expect(next.layers[0]).toMatchObject({ root: true, dismissible: false });
    expect(next.layers[1]).toMatchObject({ root: false, dismissible: true });
  });
});
