import { commandIntent, defineBindingLifecycleOwner } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { applyRuntimeCommandBuffer, createRuntimeCommandBuffer } from './runtime-engine.js';
import { dispatchRuntimeCommandIntent, isRuntimeCommandIntentEmission, runtimeCommandIntentEmission, runtimeCommandIntentRoute } from './runtime-binding.js';

describe('runtime command intent dispatch proof', () => {
  it('buffers command intent emissions without executing business logic in the view', () => {
    interface Command { readonly type: 'reader.selectHeading'; readonly headingId: string }
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
    interface Payload { readonly heading: { readonly id: string } }
    interface Command { readonly type: 'reader.selectHeading'; readonly headingId: string }
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
    expect(() => { Reflect.apply(runtimeCommandIntentEmission, undefined, [intent, undefined, null]); }).toThrow(
      'runtime command intent emission: options must be an object',
    );
    expect(() => { Reflect.apply(runtimeCommandIntentRoute, undefined, [null]); }).toThrow(
      'runtime command intent route: input must be an object',
    );
    expect(() => { Reflect.apply(dispatchRuntimeCommandIntent, undefined, [null]); }).toThrow(
      'runtime command intent dispatch: input must be an object',
    );
  });
});
