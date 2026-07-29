import type { BindingFact } from '../binding.js';
import type { OutputMode } from '../detect/tty.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardBlockName } from './types.js';
import type { RenderSection } from './render.part01.js';

interface StandardBlockRenderIdentity {
  readonly family: string;
  readonly variant: string;
}

function standardBlockRenderIdentity(blockName: StandardBlockName): StandardBlockRenderIdentity {
  switch (blockName) {
    case 'AppShell':
      return { family: 'app-structure', variant: 'wide' };
    case 'ReaderSurface':
      return { family: 'content-reading', variant: 'article' };
    case 'InspectorPanel':
      return { family: 'inspection', variant: 'selection' };
    case 'InlineStatusBlock':
    case 'InFlowStatusBlock':
      return { family: 'status', variant: 'ready' };
    case 'TransientOverlayBlock':
      return { family: 'overlay', variant: 'ready' };
    case 'ActivityStreamBlock':
      return { family: 'activity', variant: 'ready' };
    case 'ShortcutCueBlock':
      return { family: 'shortcut', variant: 'ready' };
    case 'ProgressIndicatorBlock':
      return { family: 'progress', variant: 'ready' };
    case 'FramedGroupBlock':
      return { family: 'grouping', variant: 'ready' };
    case 'ExplainabilityWalkthroughBlock':
      return { family: 'explainability', variant: 'ready' };
    case 'FormattedDocumentBlock':
      return { family: 'document', variant: 'ready' };
    case 'LinkDestinationBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'DividerBlock':
      return { family: 'structure', variant: 'ready' };
    case 'TextEntryBlock':
      return { family: 'input', variant: 'ready' };
    case 'SingleChoiceBlock':
    case 'MultipleChoiceBlock':
    case 'BinaryDecisionBlock':
      return { family: 'input', variant: 'ready' };
    case 'PeerNavigationBlock':
    case 'PathProgressBlock':
      return { family: 'navigation', variant: 'ready' };
    case 'ProgressiveDisclosureBlock':
      return { family: 'disclosure', variant: 'ready' };
    case 'BrandEmphasisBlock':
      return { family: 'branding', variant: 'ready' };
    case 'ModeAwarePrimitiveBlock':
      return { family: 'primitive', variant: 'ready' };
    case 'DenseComparisonBlock':
      return { family: 'comparison', variant: 'ready' };
    case 'HierarchyBlock':
      return { family: 'hierarchy', variant: 'ready' };
    case 'ExplorationListBlock':
      return { family: 'list', variant: 'ready' };
    case 'TemporalDependencyBlock':
      return { family: 'graph', variant: 'ready' };
  }
}

function renderFacts(
  blockName: StandardBlockName,
  sections: readonly RenderSection[],
  sectionFactPrefix: 'region' | 'slot',
  mode: OutputMode,
): readonly BindingFact[] {
  const identity = standardBlockRenderIdentity(blockName);
  const facts: BindingFact[] = [
    { kind: 'entity', key: 'block', value: blockName },
    { kind: 'state', key: 'block.rendered', value: true },
    { kind: 'entity', key: 'block.family', value: identity.family },
    { kind: 'state', key: 'block.variant', value: identity.variant },
    { kind: 'state', key: 'block.mode', value: mode, required: false },
  ];
  const selectedSection = sections.find((section) => section.id === 'selected' && section.present);
  if (selectedSection !== undefined) {
    facts.push({ kind: 'entity', key: 'block.selected', value: selectedSection.content });
  }

  for (const section of sections) {
    if (section.present) {
      facts.push({
        kind: 'entity',
        key: `${sectionFactPrefix}.${section.id}`,
        value: 'present',
      });
      facts.push({
        kind: 'label',
        key: `${sectionFactPrefix}.${section.id}.value`,
        value: section.content,
      });
      facts.push({
        kind: 'label',
        key: `semanticValue.${section.id}`,
        value: section.content,
      });
    }
  }

  return facts;
}

function isSurfaceSlotValue(value: unknown): value is Surface {
  if (value == null || typeof value !== 'object') return false;
  return 'width' in value && 'height' in value && 'get' in value
    && typeof value.width === 'number' && typeof value.height === 'number' && typeof value.get === 'function';
}

function surfaceSlotText(surface: Surface): string | undefined {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      line += surface.get(x, y).char || ' ';
    }
    lines.push(line.trimEnd());
  }

  const text = lines.join('\n').trim();
  return text === '' ? undefined : text;
}

export { isSurfaceSlotValue, renderFacts, surfaceSlotText };
