import { describe, expect, it } from 'vitest';
import {
  compileGraphqlBijouBlock,
  createGraphqlBijouBlockDebugSummary,
  lowerBijouBlockToUiScene,
} from './graphql-bijou-block.js';
import {
  hashUiSceneValue,
  lowerUiSceneToTerminalProof,
  validateUiSceneIr,
  type UiSceneIr,
} from './ui-scene-ir.js';
import { must } from '../adapters/test/index.js';
const releaseTitleSdl = `
type ReleaseTitle
  @bijouBlock(id: "release.title", component: "ReleaseTitleBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 40, rows: 5) {
  heading: String!
    @bijouText(id: "heading", x: 2, y: 1)
    @bijouI18n(key: "release.title.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")
  openNotes: String
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouText(id: "open-notes", x: 2, y: 3)
    @bijouI18n(key: "release.title.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
`;
const releaseTitleSdlWithDifferentWhitespace = `
type   ReleaseTitle
  @bijouBlock( id: "release.title", component: "ReleaseTitleBlock" )
  @bijouTarget( kind: "bijou-terminal", cols: 40, rows: 5 ) {
  heading:    String!
    @bijouText( id: "heading", x: 2, y: 1 )
    @bijouI18n( key: "release.title.heading", fallback: "Bijou" )
    @bijouToken( fg: "semantic.title.fg" )
  openNotes: String
    @bijouAction( id: "release.openNotes", command: "release.openNotes", key: "Enter" )
    @bijouText( id: "open-notes", x: 2, y: 3 )
    @bijouI18n( key: "release.title.openNotes", fallback: "Open release notes" )
    @bijouToken( fg: "semantic.action.fg", bg: "semantic.action.bg" )
}
`;
const releaseCardSdl = `
type ReleaseCard
  @bijouBlock(id: "release.card", component: "ReleaseCardBlock")
  @bijouTarget(kind: "bijou-terminal", cols: 48, rows: 8)
  @bijouGroup(id: "release.card.header", label: "Header", x: 1, y: 1, width: 46, height: 3)
  @bijouGroup(id: "release.card.footer", label: "Footer", x: 1, y: 5, width: 46, height: 2) {
  heading: String!
    @bijouText(id: "heading", group: "release.card.header", x: 2, y: 1)
    @bijouI18n(key: "release.card.heading", fallback: "Bijou")
    @bijouToken(fg: "semantic.title.fg")
  openNotes: String
    @bijouText(id: "open-notes", group: "release.card.footer", x: 2, y: 5)
    @bijouAction(id: "release.openNotes", command: "release.openNotes", key: "Enter")
    @bijouBind(id: "release.openNotes.label", kind: "state", path: "release.openNotesLabel")
    @bijouI18n(key: "release.card.openNotes", fallback: "Open release notes")
    @bijouToken(fg: "semantic.action.fg", bg: "semantic.action.bg")
}
`;
const releaseCardSdlWithDifferentWhitespace = `
type   ReleaseCard
  @bijouBlock( id: "release.card", component: "ReleaseCardBlock" )
  @bijouTarget( kind: "bijou-terminal", cols: 48, rows: 8 )
  @bijouGroup( id: "release.card.header", label: "Header", x: 1, y: 1, width: 46, height: 3 )
  @bijouGroup( id: "release.card.footer", label: "Footer", x: 1, y: 5, width: 46, height: 2 ) {
  heading:    String!
    @bijouText( id: "heading", group: "release.card.header", x: 2, y: 1 )
    @bijouI18n( key: "release.card.heading", fallback: "Bijou" )
    @bijouToken( fg: "semantic.title.fg" )
  openNotes: String
    @bijouText( id: "open-notes", group: "release.card.footer", x: 2, y: 5 )
    @bijouAction( id: "release.openNotes", command: "release.openNotes", key: "Enter" )
    @bijouBind( id: "release.openNotes.label", kind: "state", path: "release.openNotesLabel" )
    @bijouI18n( key: "release.card.openNotes", fallback: "Open release notes" )
    @bijouToken( fg: "semantic.action.fg", bg: "semantic.action.bg" )
}
`;
function rowText(surface: { get(x: number, y: number): { char: string; empty?: boolean }; width: number }, y: number): string {
  let text = '';
  for (let x = 0; x < surface.width; x++) {
    const cell = surface.get(x, y);
    text += cell.empty ? ' ' : cell.char;
  }
  return text.trimEnd();
}
export {
  compileGraphqlBijouBlock,
  createGraphqlBijouBlockDebugSummary,
  describe,
  expect,
  hashUiSceneValue,
  it,
  lowerBijouBlockToUiScene,
  lowerUiSceneToTerminalProof,
  must,
  releaseCardSdl,
  releaseCardSdlWithDifferentWhitespace,
  releaseTitleSdl,
  releaseTitleSdlWithDifferentWhitespace,
  rowText,
  validateUiSceneIr,
};
export type { UiSceneIr };
