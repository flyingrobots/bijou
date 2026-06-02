import { describe, expect, it } from 'vitest';
import {
  RE035_LAYOUT_SCOPE,
  assignLayoutChild,
  contentExtentFromBuffer,
  contentExtentFromSurface,
  defineLayoutEnvelope,
  isResolvedLayoutEnvelope,
  layoutConstraints,
  layoutExplanationFacts,
  layoutExplanationText,
  layoutPreference,
  measureTextContent,
  placeInRect,
  renderWithResolvedLayout,
  resolveStackLayout,
} from './envelope.js';

describe('RE-035 layout envelope scope', () => {
  it('records the active cycle and deferred layout work', () => {
    expect(RE035_LAYOUT_SCOPE.design).toBe('RE-035');
    expect(RE035_LAYOUT_SCOPE.status).toBe('active');
    expect(RE035_LAYOUT_SCOPE.included).toEqual([
      'layout-envelope',
      'constraint-negotiation',
      'stack',
      'place',
      'content-measurement-seam',
      'render-assignment-seam',
    ]);
    expect(RE035_LAYOUT_SCOPE.deferred).toEqual([
      'RE-036 text measurement and inline flow',
      'RE-037 overflow, viewports, scroll anchoring, and scrollbars',
      'RE-038 box model, chrome regions, hit testing, and focus maps',
      'RE-039 responsive variants, compression, and constraint fallbacks',
      'RE-040 accessible layout semantics',
      'WS-001 workspace tree',
    ]);
    expect(Object.isFrozen(RE035_LAYOUT_SCOPE.included)).toBe(true);
  });
});

describe('layout envelope facts', () => {
  it('normalizes immutable constraints, preferences, direction, fit, and assignment facts', () => {
    const envelope = defineLayoutEnvelope({
      id: ' docs.content ',
      role: ' viewport ',
      direction: 'rtl',
      constraints: layoutConstraints({
        minInline: 0,
        maxInline: 96,
        minBlock: 6,
        maxBlock: 'unbounded',
      }),
      preference: layoutPreference({
        minInline: 32,
        preferredInline: 72,
        maxInline: 'unbounded',
        minBlock: 6,
        preferredBlock: 18,
        maxBlock: 24,
      }),
      fit: 'clip',
    });

    expect(envelope.id).toBe('docs.content');
    expect(envelope.role).toBe('viewport');
    expect(envelope.direction).toBe('rtl');
    expect(envelope.constraints).toEqual({
      minInline: 0,
      maxInline: 96,
      minBlock: 6,
      maxBlock: 'unbounded',
    });
    expect(envelope.preference.preferredInline).toBe(72);
    expect(envelope.fit).toBe('clip');
    expect(isResolvedLayoutEnvelope(envelope)).toBe(false);
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(Object.isFrozen(envelope.constraints)).toBe(true);
    expect(Object.isFrozen(envelope.preference)).toBe(true);
  });
});

describe('render-facing layout seam', () => {
  it('rejects visible render input without an assigned layout envelope', () => {
    const envelope = defineLayoutEnvelope({
      id: 'docs.reader',
      role: 'region',
      constraints: layoutConstraints({ maxInline: 80, maxBlock: 24 }),
      preference: layoutPreference({ preferredInline: 72, preferredBlock: 18 }),
    });

    expect(() => renderWithResolvedLayout(envelope, () => 'unreachable')).toThrow(
      'layout render seam: visible node docs.reader requires an assigned layout envelope',
    );
  });

  it('passes the parent-assigned rect to the renderer without deriving geometry from output', () => {
    const envelope = assignLayoutChild(
      defineLayoutEnvelope({
        id: 'docs.reader',
        role: 'region',
        constraints: layoutConstraints({ maxInline: 80, maxBlock: 24 }),
        preference: layoutPreference({ preferredInline: 72, preferredBlock: 18 }),
      }),
      { inlineStart: 24, blockStart: 1, inlineSize: 52, blockSize: 22 },
      'parent stack assigned remaining inline space',
    );

    const rendered = renderWithResolvedLayout(envelope, ({ assigned }) => {
      return `paint ${assigned.inlineStart}:${assigned.blockStart}:${assigned.inlineSize}:${assigned.blockSize}`;
    });

    expect(rendered.output).toBe('paint 24:1:52:22');
    expect(rendered.assigned).toEqual({
      inlineStart: 24,
      blockStart: 1,
      inlineSize: 52,
      blockSize: 22,
    });
    expect(Object.isFrozen(rendered)).toBe(true);
  });
});

describe('content measurement seam', () => {
  it('reports surface and buffer cell extents directly', () => {
    expect(contentExtentFromSurface({ width: 40, height: 7 })).toEqual({
      source: 'surface',
      inlineSize: 40,
      blockSize: 7,
      facts: [],
    });
    expect(contentExtentFromBuffer({ width: 18.9, height: 3.1 })).toEqual({
      source: 'buffer',
      inlineSize: 18,
      blockSize: 3,
      facts: [],
    });
  });

  it('keeps text-to-cell measurement behind an injected adapter', () => {
    const calls: unknown[] = [];
    const measured = measureTextContent({
      text: 'wide copy',
      availableInline: 5,
      direction: 'rtl',
      wrap: 'word',
      adapter(input) {
        calls.push(input);
        return {
          inlineSize: 5,
          blockSize: 2,
          facts: [{ kind: 'measurement', key: 'adapter', value: 'test' }],
        };
      },
    });

    expect(measured).toEqual({
      source: 'text',
      inlineSize: 5,
      blockSize: 2,
      facts: [{ kind: 'measurement', key: 'adapter', value: 'test' }],
    });
    expect(calls).toEqual([{
      text: 'wide copy',
      availableInline: 5,
      direction: 'rtl',
      wrap: 'word',
    }]);
  });
});

describe('parent-owned measurement and assignment', () => {
  it('does not let child preference force parent assignment', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.nav',
      role: 'navigation',
      constraints: layoutConstraints({ maxInline: 120, maxBlock: 24 }),
      preference: layoutPreference({
        minInline: 12,
        preferredInline: 999,
        maxInline: 'unbounded',
        preferredBlock: 24,
      }),
    });

    const assigned = assignLayoutChild(
      child,
      { inlineStart: 0, blockStart: 0, inlineSize: 24, blockSize: 24 },
      'parent fixed track wins over preferred inline size',
    );

    expect(assigned.preference.preferredInline).toBe(999);
    expect(assigned.assigned.inlineSize).toBe(24);
    expect(assigned.reason).toBe('parent fixed track wins over preferred inline size');
    expect(isResolvedLayoutEnvelope(assigned)).toBe(true);
  });
});

describe('stack layout', () => {
  it('assigns fixed and flexible tracks with gaps deterministically', () => {
    const resolved = resolveStackLayout({
      id: 'docs.shell',
      role: 'shell',
      axis: 'inline',
      direction: 'ltr',
      rect: { inlineStart: 0, blockStart: 0, inlineSize: 96, blockSize: 24 },
      gap: 1,
      children: [
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.nav',
            role: 'navigation',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ preferredInline: 24, preferredBlock: 24 }),
          }),
          track: { kind: 'fixed', size: 24 },
        },
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.content',
            role: 'viewport',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ minInline: 32, preferredInline: 72, preferredBlock: 24 }),
          }),
          track: { kind: 'flex', weight: 1 },
        },
        {
          envelope: defineLayoutEnvelope({
            id: 'docs.inspector',
            role: 'inspector',
            constraints: layoutConstraints({ maxInline: 96, maxBlock: 24 }),
            preference: layoutPreference({ preferredInline: 18, preferredBlock: 24 }),
          }),
          track: { kind: 'fixed', size: 18 },
        },
      ],
    });

    expect(resolved.children.map((child) => child.assigned)).toEqual([
      { inlineStart: 0, blockStart: 0, inlineSize: 24, blockSize: 24 },
      { inlineStart: 25, blockStart: 0, inlineSize: 52, blockSize: 24 },
      { inlineStart: 78, blockStart: 0, inlineSize: 18, blockSize: 24 },
    ]);
    expect(resolved.children[1]!.reason).toContain('stack inline flex track');
  });

  it('distributes leftover flexible cells with a stable source-order policy', () => {
    const child = (id: string) => ({
      envelope: defineLayoutEnvelope({
        id,
        role: 'pane',
        constraints: layoutConstraints({ maxInline: 5, maxBlock: 1 }),
        preference: layoutPreference({ preferredInline: 1, preferredBlock: 1 }),
      }),
      track: { kind: 'flex' as const },
    });

    const resolved = resolveStackLayout({
      id: 'rounding',
      role: 'test',
      axis: 'inline',
      rect: { inlineStart: 0, blockStart: 0, inlineSize: 5, blockSize: 1 },
      children: [child('a'), child('b'), child('c')],
    });

    expect(resolved.roundingPolicy).toBe('largest-remainder-source-order');
    expect(resolved.children.map((item) => item.assigned.inlineSize)).toEqual([2, 2, 1]);
  });
});

describe('place layout', () => {
  it('aligns children at logical start, center, end, and stretch', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.badge',
      role: 'status',
      constraints: layoutConstraints({ maxInline: 20, maxBlock: 10 }),
      preference: layoutPreference({ preferredInline: 4, preferredBlock: 2 }),
    });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'start',
      blockAlign: 'start',
    }).assigned).toEqual({ inlineStart: 2, blockStart: 3, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'center',
      blockAlign: 'center',
    }).assigned).toEqual({ inlineStart: 10, blockStart: 7, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'end',
      blockAlign: 'end',
    }).assigned).toEqual({ inlineStart: 18, blockStart: 11, inlineSize: 4, blockSize: 2 });

    expect(placeInRect({
      envelope: child,
      direction: 'ltr',
      parent: { inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 },
      size: { inlineSize: 4, blockSize: 2 },
      inlineAlign: 'stretch',
      blockAlign: 'stretch',
    }).assigned).toEqual({ inlineStart: 2, blockStart: 3, inlineSize: 20, blockSize: 10 });
  });

  it('flips inline start and end under RTL without changing source order', () => {
    const child = defineLayoutEnvelope({
      id: 'docs.action',
      role: 'button',
      constraints: layoutConstraints({ maxInline: 20, maxBlock: 1 }),
      preference: layoutPreference({ preferredInline: 4, preferredBlock: 1 }),
    });

    expect(placeInRect({
      envelope: child,
      direction: 'rtl',
      parent: { inlineStart: 0, blockStart: 0, inlineSize: 20, blockSize: 1 },
      size: { inlineSize: 4, blockSize: 1 },
      inlineAlign: 'start',
      blockAlign: 'start',
    }).assigned.inlineStart).toBe(16);

    expect(placeInRect({
      envelope: child,
      direction: 'rtl',
      parent: { inlineStart: 0, blockStart: 0, inlineSize: 20, blockSize: 1 },
      size: { inlineSize: 4, blockSize: 1 },
      inlineAlign: 'end',
      blockAlign: 'start',
    }).assigned.inlineStart).toBe(0);
  });
});

describe('layout explanation facts', () => {
  it('explains resolved layout without rendering strings or ANSI output', () => {
    const resolved = assignLayoutChild(
      defineLayoutEnvelope({
        id: 'docs.content',
        role: 'viewport',
        direction: 'ltr',
        constraints: layoutConstraints({ minInline: 0, maxInline: 96, minBlock: 0, maxBlock: 24 }),
        preference: layoutPreference({
          minInline: 32,
          preferredInline: 72,
          maxInline: 'unbounded',
          minBlock: 6,
          preferredBlock: 18,
          maxBlock: 'unbounded',
        }),
      }),
      { inlineStart: 24, blockStart: 1, inlineSize: 72, blockSize: 22 },
      'took remaining inline space in stack after fixed nav and status chrome',
    );

    expect(layoutExplanationFacts(resolved)).toEqual([
      { kind: 'layout', key: 'node.id', value: 'docs.content' },
      { kind: 'layout', key: 'role', value: 'viewport' },
      { kind: 'layout', key: 'direction', value: 'ltr' },
      { kind: 'layout', key: 'constraints.inline', value: '0..96' },
      { kind: 'layout', key: 'constraints.block', value: '0..24' },
      { kind: 'layout', key: 'preference.inline', value: 'min 32 preferred 72 max unbounded' },
      { kind: 'layout', key: 'preference.block', value: 'min 6 preferred 18 max unbounded' },
      { kind: 'layout', key: 'assigned', value: 'inline-start 24 block-start 1 inline-size 72 block-size 22' },
      {
        kind: 'layout',
        key: 'reason',
        value: 'took remaining inline space in stack after fixed nav and status chrome',
      },
    ]);
    expect(layoutExplanationText(resolved)).toContain('node docs.content');
    expect(layoutExplanationText(resolved)).not.toContain('\u001b[');
  });
});
