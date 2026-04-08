import { z } from 'zod';
import { explainability } from '@flyingrobots/bijou';
import { mcpContext } from '../context.js';
import type { ToolRegistration } from '../types.js';

const inputShape = {
  title: z.string().describe('Decision or artifact title.'),
  label: z.string().optional().describe('Short label (e.g. "Decision", "Recommendation").'),
  artifactKind: z.string().optional().describe('Kind of artifact being explained.'),
  source: z.string().optional().describe('Source of the decision (e.g. model name, system).'),
  sourceMode: z.string().optional().describe('Mode indicator for the source.'),
  rationale: z.string().optional().describe('Explanation of why this decision was made.'),
  evidence: z.array(z.object({
    label: z.string().describe('Evidence item label.'),
    value: z.string().describe('Evidence item value.'),
  })).optional().describe('Supporting evidence items.'),
  nextAction: z.string().optional().describe('Suggested next action.'),
  governance: z.string().optional().describe('Governance or compliance note.'),
  confidence: z.union([z.number(), z.string()]).optional()
    .describe('Confidence level (number 0-1 or descriptive string).'),
  width: z.number().optional().describe('Box width.'),
  terminalWidth: z.number().optional().describe('Terminal width override (default 80).'),
};

const inputSchema = z.object(inputShape);

export const explainabilityTool: ToolRegistration = {
  name: 'bijou_explainability',
  description: 'Render an AI explainability card showing a decision with rationale, evidence, confidence, and governance. Useful for documenting AI-assisted decisions.',
  inputSchema: inputShape,
  handler: async (args) => {
    const input = inputSchema.parse(args);
    const ctx = mcpContext(input.terminalWidth);
    const result = explainability({
      title: input.title,
      label: input.label,
      artifactKind: input.artifactKind,
      source: input.source,
      sourceMode: input.sourceMode,
      rationale: input.rationale,
      evidence: input.evidence,
      nextAction: input.nextAction,
      governance: input.governance,
      confidence: input.confidence,
      width: input.width,
      ctx,
    });
    return { content: [{ type: 'text', text: result }] };
  },
};
