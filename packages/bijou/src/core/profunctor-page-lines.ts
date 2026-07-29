import type {
  ProfunctorPageArtifact,
  ProfunctorPageNode,
} from './profunctor-page-model.js';
import type {
  ProfunctorPageCapabilityOutcome,
  ProfunctorPageInspectionMode,
} from './profunctor-page-target-types.js';
import type { PageAction } from './profunctor-page-actions.js';
import type { JsonRecord } from './profunctor-page-json-record.js';
import { expectRecord, expectStrings } from './profunctor-page-json.js';

export interface PageLine {
  readonly text: string;
  readonly actionId?: string;
}

export function linesForPageNode(
  page: ProfunctorPageArtifact,
  node: ProfunctorPageNode,
  actions: readonly PageAction[],
  outcomes: readonly ProfunctorPageCapabilityOutcome[],
  mode: ProfunctorPageInspectionMode,
): PageLine[] {
  switch (mode) {
    case 'node-ids':
      return [{ text: node.pageNodeId }];
    case 'source-refs':
      return [{ text: `source · ${sourceRefs(node).join(' · ')}` }];
    case 'token-refs':
      return [{ text: `tokens · ${tokenRefs(node).join(' · ')}` }];
    case 'composition':
      return [{
        text: `${page.compositionRef} · ${node.templateNodeId} · ${node.blockDefinitionId}`,
      }];
    case 'obstructions':
      return obstructionLines(node, outcomes);
    case 'normal':
      return normalLines(page, node, actions);
  }
}

function normalLines(
  page: ProfunctorPageArtifact,
  node: ProfunctorPageNode,
  actions: readonly PageAction[],
): PageLine[] {
  const heading = page.outline.find((item) => item.pageNodeId === node.pageNodeId)?.text;
  switch (node.blockDefinitionId) {
    case 'block:page':
      return [{ text: `${String(node.props.displayTitle)} · ${page.route}` }];
    case 'block:project-hero':
      return [
        { text: heading ?? String(node.props.title) },
        { text: String(node.props.summary) },
        ...actionLines(node, actions),
      ];
    case 'block:project-facts':
      return [
        { text: heading ?? 'Project facts' },
        { text: `${String(node.props.kind)} · ${String(node.props.organization)} · ${String(node.props.program)}` },
        { text: expectStrings(
          node.props.categoryPaths,
          `${node.pageNodeId}.props.categoryPaths`,
        ).join(' · ') },
      ];
    case 'block:project-documentation':
      return [{ text: heading ?? 'Documentation' }, ...actionLines(node, actions)];
    case 'block:project-related':
      return [{ text: heading ?? 'Related projects' }, ...actionLines(node, actions)];
    default:
      return [];
  }
}

function actionLines(
  node: ProfunctorPageNode,
  actions: readonly PageAction[],
): PageLine[] {
  return actions
    .filter((action) => action.pageNodeId === node.pageNodeId)
    .map((action) => ({
      text: `${action.label} → ${action.target}`,
      actionId: action.actionId,
    }));
}

function obstructionLines(
  node: ProfunctorPageNode,
  outcomes: readonly ProfunctorPageCapabilityOutcome[],
): PageLine[] {
  const byCapability = new Map(outcomes.map((outcome) => [outcome.capability, outcome]));
  return node.requiredCapabilities.map((capability) => {
    const outcome = byCapability.get(capability);
    return {
      text: `${capability} · ${outcome?.disposition ?? 'residual'} · ${outcome?.detail ?? 'unsupported'}`,
    };
  });
}

export function sourceRefs(node: ProfunctorPageNode): string[] {
  const occurrences = Object.values(node.sourceBindings);
  if (occurrences.length > 0) {
    return occurrences;
  }
  const provenance: JsonRecord | undefined = node.props.sourceProvenance === undefined
    ? undefined
    : expectRecord(node.props.sourceProvenance, `${node.pageNodeId}.props.sourceProvenance`);
  return provenance == null
    ? ['none']
    : [`${String(provenance.sourcePath)}#${String(provenance.exportName)}.${String(provenance.recordId)}`];
}

function tokenRefs(node: ProfunctorPageNode): string[] {
  const refs = Object.values(node.tokens);
  return refs.length === 0 ? ['none declared'] : refs;
}
