import type {
  ProfunctorPageCapabilityOutcome,
} from './profunctor-page-target-types.js';

const OUTCOMES: Readonly<Record<string, Omit<ProfunctorPageCapabilityOutcome, 'capability'>>> = {
  headings: {
    disposition: 'structural-fact',
    detail: 'Heading level and text are preserved as target-map facts.',
  },
  landmarks: {
    disposition: 'structural-fact',
    detail: 'Landmark roles are preserved as facts without browser claims.',
  },
  'native-links': {
    disposition: 'action-adapter',
    detail: 'Link destinations become explicit Bijou action facts.',
  },
  'semantic-html': {
    disposition: 'residual',
    detail: 'Terminal output does not claim semantic HTML.',
  },
};

export function capabilityOutcomes(
  requirements: readonly string[],
): ProfunctorPageCapabilityOutcome[] {
  return requirements.map((capability) => {
    const outcome = OUTCOMES[capability];
    return outcome == null
      ? {
          capability,
          disposition: 'residual',
          detail: `No Bijou target claim exists for ${capability}.`,
        }
      : { capability, ...outcome };
  });
}
