import type { BijouContext } from '@flyingrobots/bijou';
import { describe, expect, it } from 'vitest';
import { mountControls } from './dom-mount.test-support.js';

describe('mountBijouDom() theme and direction sync', () => {
  it('writes semantic, surface, and border tokens as custom properties at mount', () => {
    const { ctx, handle, root } = mountControls();
    const properties = root().properties;

    expect(properties.get('--bijou-semantic-primary')).toBe(ctx.semantic('primary').hex);
    expect(properties.get('--bijou-semantic-error')).toBe(ctx.semantic('error').hex);
    expect(properties.get('--bijou-surface-elevated')).toBe(ctx.surface('elevated').hex);
    expect(properties.get('--bijou-border-muted')).toBe(ctx.border('muted').hex);
    expect(properties.size).toBe(18);
    handle.stop();
  });

  it('updates a changed token live without recreating any node', () => {
    const holder: { ctx?: BijouContext } = {};
    const mounted = mountControls({}, {
      onTheme: () => { holder.ctx?.tokenGraph.set('semantic.primary', { hex: '#ff0000' }); },
    });
    holder.ctx = mounted.ctx;
    const count = mounted.node('app.count');
    const before = { ...mounted.doc.counts };

    mounted.doc.dispatch(mounted.node('app.theme'), 'click');

    expect(mounted.root().properties.get('--bijou-semantic-primary')).toBe('#ff0000');
    expect(mounted.doc.counts.created).toBe(before.created);
    expect(mounted.doc.counts.writes - before.writes).toBe(1);
    expect(mounted.node('app.count')).toBe(count);
    mounted.handle.stop();
  });

  it('flips dir from the model direction without recreating any node', () => {
    const mounted = mountControls({ direction: (model) => model.dir });
    const region = mounted.node('app');
    expect(mounted.root().getAttribute('dir')).toBe('ltr');
    const created = mounted.doc.counts.created;

    mounted.doc.dispatch(mounted.node('app.dir'), 'click');

    expect(mounted.root().getAttribute('dir')).toBe('rtl');
    expect(mounted.node('app')).toBe(region);
    expect(mounted.doc.counts.created).toBe(created);
    mounted.doc.dispatch(mounted.node('app.dir'), 'click');
    expect(mounted.root().getAttribute('dir')).toBe('ltr');
    mounted.handle.stop();
  });

  it('writes no dir attribute without a direction option', () => {
    const { handle, root } = mountControls();

    expect(root().getAttribute('dir')).toBeNull();
    handle.stop();
  });
});
