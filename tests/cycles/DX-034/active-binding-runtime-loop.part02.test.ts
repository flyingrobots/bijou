import { describe, expect, it } from 'vitest';
import { commandIntent, defineBindingLifecycleOwner } from '../../../packages/bijou/src/index.js';
import { applyRuntimeCommandBuffer, createRuntimeCommandBuffer } from '../../../packages/bijou-tui/src/runtime-engine.js';
import { dispatchRuntimeCommandIntent, runtimeCommandIntentEmission, runtimeCommandIntentRoute } from '../../../packages/bijou-tui/src/runtime-binding.js';
import { readRepoFile } from '../repo.js';

describe('DX-034G/H/I active binding runtime loop', () => {
  it('routes command intent emissions into the runtime command buffer for later business logic', () => {
      interface Command { readonly type: 'reader.selectHeading'; readonly headingId: string }
      const owner = defineBindingLifecycleOwner({ id: 'reader.view', kind: 'view' });
      const selectHeading = commandIntent<{ readonly headingId: string }>('reader.selectHeading');
      const emission = runtimeCommandIntentEmission(
        selectHeading,
        { headingId: 'intro' },
        { owner },
      );
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
    });

  it('documents DX-034G through DX-034I without claiming subscriptions or rendering', () => {
      const cycle = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');
      const changelog = readRepoFile('docs/CHANGELOG.md');
      expect(cycle).toContain('### DX-034G Active View Binding Collection');
      expect(cycle).toContain('### DX-034H Provider Update Invalidation Flow');
      expect(cycle).toContain('### DX-034I Command Intent Dispatch Proof');
      expect(cycle).toContain('`blocksBelow: false`');
      expect(cycle).toContain('`blocksBelow: true` blocks lower layers');
      expect(cycle).toContain('do not create duplicate invalidations');
      expect(cycle).toContain('DX-034G does not subscribe, refresh, dispatch, render, cache');
      expect(cycle).toContain('DX-034H does not fetch data, subscribe, refresh providers');
      expect(cycle).toContain('Command intents and emissions expose no provider handles');
      expect(changelog).toContain('Runtime binding loop proofs for DX-034');
    });
});
