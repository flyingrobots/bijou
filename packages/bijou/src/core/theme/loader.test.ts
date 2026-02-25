import { describe, it, expect } from 'vitest';
import { loadTheme, loadThemesFromDir, toDTCG } from './dtcg.js';
import { CYAN_MAGENTA } from './presets.js';

describe('Theme loader', () => {
  const mockIO = {
    files: {
      'themes/theme.json': JSON.stringify(toDTCG(CYAN_MAGENTA)),
      'themes/invalid.json': 'not-json',
      'themes/other.txt': 'hello',
    } as Record<string, string>,
    readFile(path: string) {
      if (this.files[path]) return this.files[path];
      throw new Error(`File not found: ${path}`);
    },
    readDir(path: string) {
      if (path === 'themes') {
        return Object.keys(this.files).map(k => k.split('/')[1]!);
      }
      return [];
    },
    joinPath(...s: string[]) {
      return s.join('/');
    },
  };

  it('loadTheme loads a theme from a JSON file', () => {
    const theme = loadTheme(mockIO, 'themes/theme.json');
    expect(theme.name).toBe('cyan-magenta');
    expect(theme.status.success.hex).toBe('#00ff00');
  });

  it('loadThemesFromDir loads all .json files in a directory', () => {
    const themes = loadThemesFromDir(mockIO, 'themes');
    expect(themes['cyan-magenta']).toBeDefined();
    expect(Object.keys(themes)).toHaveLength(1); // invalid.json failed to parse
  });
});
