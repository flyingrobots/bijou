import { EMPTY_BINDING_TRANSITIONS } from './binding-lifecycle.part01.js';

import type { BindingLifecycleState, BindingLifecycleTransition, BindingLifecycleTransitionReason } from './binding-lifecycle.part01.js';

import { isBindingLifecycleState, isBindingTransitionReason } from './binding-lifecycle.part06.js';
export function freezeTransitions(
  transitions: readonly BindingLifecycleTransition[] | undefined,
  expectedState: BindingLifecycleState,
): readonly BindingLifecycleTransition[] {
  if (transitions === undefined || transitions.length === 0) {
    return EMPTY_BINDING_TRANSITIONS;
  }

  const frozenTransitions = transitions.map(freezeTransition);
  for (let index = 1; index < frozenTransitions.length; index += 1) {
    const previous = frozenTransitions[index - 1];
    const current = frozenTransitions[index];
    if (previous === undefined || current === undefined) {
      throw new Error(`binding lifecycle: missing transition at index ${String(index)}`);
    }
    if (previous.to !== current.from) {
      throw new Error(
        `binding lifecycle: transition chain is discontinuous at index ${String(index)}`,
      );
    }
  }

  const finalTransition = frozenTransitions.at(-1);
  if (finalTransition !== undefined && finalTransition.to !== expectedState) {
    throw new Error(
      `binding lifecycle: final transition state ${finalTransition.to} `
      + `does not match record state ${expectedState}`,
    );
  }

  return Object.freeze(frozenTransitions);
}
export function freezeTransition(
  transition: BindingLifecycleTransition,
): BindingLifecycleTransition {
  if (!isBindingLifecycleState(transition.from)) {
    throw new Error(`binding transition: unsupported from state ${String(transition.from)}`);
  }
  if (!isBindingLifecycleState(transition.to)) {
    throw new Error(`binding transition: unsupported to state ${String(transition.to)}`);
  }
  if (!isBindingTransitionReason(transition.reason)) {
    throw new Error(`binding transition: unsupported reason ${String(transition.reason)}`);
  }
  assertAllowedTransition(transition);

  return Object.freeze({
    from: transition.from,
    to: transition.to,
    reason: transition.reason,
  });
}
export function assertAllowedTransition(transition: BindingLifecycleTransition): void {
  if (transition.from === 'disposed') {
    throw new Error(`binding transition: disposed bindings cannot transition to ${transition.to}`);
  }

  const expectedReason = expectedTransitionReason(transition.from, transition.to);
  if (expectedReason === undefined) {
    throw new Error(`binding transition: unsupported ${transition.from} -> ${transition.to}`);
  }
  if (transition.reason !== expectedReason) {
    throw new Error(
      `binding transition: reason ${transition.reason} does not match `
      + `${transition.from} -> ${transition.to}`,
    );
  }
}
export function expectedTransitionReason(
  from: BindingLifecycleState,
  to: BindingLifecycleState,
): BindingLifecycleTransitionReason | undefined {
  if (from === 'active' && to === 'suspended') {
    return 'suspend';
  }
  if (from === 'active' && to === 'disposed') {
    return 'dispose';
  }
  if (from === 'suspended' && to === 'active') {
    return 'activate';
  }
  if (from === 'suspended' && to === 'disposed') {
    return 'dispose';
  }
  if ((from === 'active' || from === 'suspended') && from === to) {
    return 'invalidate';
  }

  return undefined;
}
