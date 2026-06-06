import { describe, expect, it } from 'vitest';
import { existsRepoPath, readRepoFile } from '../repo.js';

describe('DL-013 design token and theme builder spec', () => {
  it('defines the token, theme, mode, and style relationship', () => {
    expect(existsRepoPath('docs/design/DL-013-design-token-theme-builder-api.md')).toBe(true);

    const design = readRepoFile('docs/design/DL-013-design-token-theme-builder-api.md');

    expect(design).toContain('Tokens describe semantic color slots in a theme.');
    expect(design).toContain('Themes own mode-specific token values.');
    expect(design).toContain('Dark and light are the required first theme modes.');
    expect(design).toContain('Styles consume resolved tokens at render time.');
    expect(design).toContain('Styles do not register tokens, own theme values, or decide dark/light mode.');
    expect(design).toContain('defineTheme()');
    expect(design).toContain('.mode("dark"');
    expect(design).toContain('.mode("light"');
    expect(design).toContain('tokenRef("color.status.danger.bg")');
    expect(design).toContain('style()');
    expect(design).toContain('render(surfaceText, { theme, mode: "dark" })');
  });

  it('puts DL-013 onto the GitHub-backed roadmap', () => {
    const roadmap = readRepoFile('docs/ROADMAP.md');

    expect(roadmap).toContain('| `Beyond` | [Beyond](https://github.com/flyingrobots/bijou/milestone/3) | 30 | 1 |');
    expect(roadmap).toContain('Design Tokens And Theme Modes');
    expect(roadmap).toContain('[#308](https://github.com/flyingrobots/bijou/issues/308)');
    expect(roadmap).toContain('DL-013 design token and theme builder API');
  });
});
