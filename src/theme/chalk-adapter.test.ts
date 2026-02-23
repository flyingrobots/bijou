import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { styled, styledStatus, chalkFromToken } from './chalk-adapter.js';
import { _resetThemeForTesting } from './resolve.js';
import type { TokenValue } from './tokens.js';

describe('chalk-adapter', () => {
  beforeEach(() => {
    _resetThemeForTesting();
    delete process.env['NO_COLOR'];
    delete process.env['BIJOU_THEME'];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetThemeForTesting();
  });

  describe('styled', () => {
    it('produces string containing the text', () => {
      const token: TokenValue = { hex: '#ff0000' };
      const result = styled(token, 'hello');
      expect(result).toContain('hello');
    });

    it('applies modifiers without error', () => {
      const token: TokenValue = { hex: '#808080', modifiers: ['dim', 'strikethrough'] };
      const result = styled(token, 'graveyard');
      expect(result).toContain('graveyard');
    });

    it('returns raw text for empty modifiers', () => {
      const token: TokenValue = { hex: '#ffffff' };
      const result = styled(token, 'plain');
      expect(result).toContain('plain');
    });
  });

  describe('styledStatus', () => {
    it('renders known status strings', () => {
      const result = styledStatus('success');
      expect(result).toContain('success');
    });

    it('uses muted fallback for unrecognized status', () => {
      const result = styledStatus('FAKE_STATUS');
      expect(result).toContain('FAKE_STATUS');
    });

    it('accepts custom text override', () => {
      const result = styledStatus('success', 'completed');
      expect(result).toContain('completed');
      expect(result).not.toContain('success');
    });

    it('renders all base status keys without error', async () => {
      const { getTheme: gt } = await import('./resolve.js');
      const t = gt();
      const keys = Object.keys(t.theme.status);
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        const result = styledStatus(key);
        expect(result).toContain(key);
      }
    });
  });

  describe('chalkFromToken', () => {
    it('returns a callable chalk instance', () => {
      const token: TokenValue = { hex: '#00ff00' };
      const c = chalkFromToken(token);
      expect(typeof c).toBe('function');
      expect(c('test')).toContain('test');
    });

    it('handles all modifier types', () => {
      const token: TokenValue = { hex: '#ff00ff', modifiers: ['bold', 'dim', 'strikethrough', 'inverse'] };
      const c = chalkFromToken(token);
      expect(c('styled')).toContain('styled');
    });
  });

  describe('NO_COLOR mode', () => {
    it('styled output still contains the text', () => {
      process.env['NO_COLOR'] = '1';
      _resetThemeForTesting();
      const token: TokenValue = { hex: '#ff0000' };
      const result = styled(token, 'error text');
      expect(result).toContain('error text');
    });

    it('modifiers are applied without error in NO_COLOR mode', () => {
      process.env['NO_COLOR'] = '1';
      _resetThemeForTesting();
      const token: TokenValue = { hex: '#808080', modifiers: ['bold'] };
      const result = styled(token, 'bold text');
      expect(result).toContain('bold text');
    });
  });
});
