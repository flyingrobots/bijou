import { capture } from './graphql-parser-utils.js';

import type { ParsedGraphqlBijouBlock } from './graphql-bijou-block.part01.js';

import { DIRECTIVE_PATTERN, FIELD_PATTERN, TYPE_PATTERN } from './graphql-bijou-block.part02.js';

import type { FieldDraft, ParsedDirective, ParsedField } from './graphql-bijou-block.part02.js';

import { parseDirectiveArgs } from './graphql-bijou-block.part06.js';

import { stripGraphqlLineComment } from './graphql-bijou-block.part10.js';
export function parseConstrainedGraphqlBijouBlock(source: string): ParsedGraphqlBijouBlock {
  const typeDirectiveTexts: string[] = [];
  const fields: ParsedField[] = [];
  let typeName: string | undefined;
  let insideType = false;
  let currentField: FieldDraft | undefined;

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const trimmed = stripGraphqlLineComment(rawLine).trim();
    if (trimmed.length === 0) {
      continue;
    }

    if (typeName == null) {
      const match = TYPE_PATTERN.exec(trimmed);
      if (match == null) {
        continue;
      }
      typeName = capture(match, 1, 'type name');
      const rest = match[2] ?? '';
      typeDirectiveTexts.push(rest);
      insideType = rest.includes('{');
      continue;
    }

    if (!insideType) {
      typeDirectiveTexts.push(trimmed);
      insideType = trimmed.includes('{');
      continue;
    }

    if (trimmed.startsWith('}')) {
      if (currentField != null) {
        fields.push(fieldFromDraft(currentField));
        currentField = undefined;
      }
      break;
    }

    const fieldMatch = FIELD_PATTERN.exec(trimmed);
    if (fieldMatch != null) {
      if (currentField != null) {
        fields.push(fieldFromDraft(currentField));
      }
      currentField = {
        fieldName: capture(fieldMatch, 1, 'field name'),
        graphqlType: capture(fieldMatch, 2, 'field type'),
        directiveTexts: [fieldMatch[3] ?? ''],
      };
      continue;
    }

    if (trimmed.startsWith('@') && currentField != null) {
      currentField.directiveTexts.push(trimmed);
    }
  }

  if (typeName == null) {
    throw new Error('GraphQL Bijou block source must include a type definition.');
  }
  if (currentField != null) {
    fields.push(fieldFromDraft(currentField));
  }

  return {
    typeName,
    typeDirectives: parseDirectives(typeDirectiveTexts.join('\n')),
    fields,
  };
}
export function fieldFromDraft(draft: FieldDraft): ParsedField {
  return {
    fieldName: draft.fieldName,
    graphqlType: draft.graphqlType,
    directives: parseDirectives(draft.directiveTexts.join('\n')),
  };
}
export function parseDirectives(source: string): readonly ParsedDirective[] {
  const directives: ParsedDirective[] = [];
  for (const match of source.matchAll(DIRECTIVE_PATTERN)) {
    directives.push({
      name: capture(match, 1, 'directive name'),
      args: parseDirectiveArgs(match[2] ?? ''),
    });
  }
  return directives;
}
