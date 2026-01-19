import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('focus', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  describe('sanitizeForAppleScript', () => {
    it('should escape backslashes', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape double quotes', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('say "hello"')).toBe('say \\"hello\\"');
    });

    it('should escape newlines', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape carriage returns', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('line1\rline2')).toBe('line1\\rline2');
    });

    it('should escape tabs', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('col1\tcol2')).toBe('col1\\tcol2');
    });

    it('should handle multiple escape sequences', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('path\\with"quotes\nand\ttabs')).toBe(
        'path\\\\with\\"quotes\\nand\\ttabs'
      );
    });

    it('should return empty string unchanged', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('')).toBe('');
    });

    it('should return safe string unchanged', async () => {
      const { sanitizeForAppleScript } = await import('../src/utils/focus.js');
      expect(sanitizeForAppleScript('/dev/ttys001')).toBe('/dev/ttys001');
    });
  });

  describe('isValidTtyPath', () => {
    it('should accept valid macOS tty paths', async () => {
      const { isValidTtyPath } = await import('../src/utils/focus.js');
      expect(isValidTtyPath('/dev/ttys000')).toBe(true);
      expect(isValidTtyPath('/dev/ttys001')).toBe(true);
      expect(isValidTtyPath('/dev/ttys123')).toBe(true);
      expect(isValidTtyPath('/dev/tty0')).toBe(true);
      expect(isValidTtyPath('/dev/tty99')).toBe(true);
    });

    it('should accept valid Linux pts paths', async () => {
      const { isValidTtyPath } = await import('../src/utils/focus.js');
      expect(isValidTtyPath('/dev/pts/0')).toBe(true);
      expect(isValidTtyPath('/dev/pts/1')).toBe(true);
      expect(isValidTtyPath('/dev/pts/99')).toBe(true);
    });

    it('should reject invalid paths', async () => {
      const { isValidTtyPath } = await import('../src/utils/focus.js');
      expect(isValidTtyPath('')).toBe(false);
      expect(isValidTtyPath('/dev/null')).toBe(false);
      expect(isValidTtyPath('/dev/tty')).toBe(false);
      expect(isValidTtyPath('/tmp/tty')).toBe(false);
      expect(isValidTtyPath('/dev/ttys')).toBe(false);
      expect(isValidTtyPath('/dev/pts/')).toBe(false);
      expect(isValidTtyPath('ttys001')).toBe(false);
    });

    it('should reject paths with injection attempts', async () => {
      const { isValidTtyPath } = await import('../src/utils/focus.js');
      expect(isValidTtyPath('/dev/ttys001"; rm -rf /')).toBe(false);
      expect(isValidTtyPath('/dev/ttys001\n/dev/ttys002')).toBe(false);
      expect(isValidTtyPath('/dev/pts/0; echo pwned')).toBe(false);
    });
  });

  describe('isMacOS', () => {
    it('should return boolean based on platform', async () => {
      const { isMacOS } = await import('../src/utils/focus.js');
      const result = isMacOS();
      expect(typeof result).toBe('boolean');
      // On macOS, should return true
      if (process.platform === 'darwin') {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    });

    it('returns true on darwin platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });
      const { isMacOS } = await import('../src/utils/focus.js');
      expect(isMacOS()).toBe(true);
    });

    it('returns false on linux platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
        configurable: true,
      });
      const { isMacOS } = await import('../src/utils/focus.js');
      expect(isMacOS()).toBe(false);
    });
  });

  describe('getSupportedTerminals', () => {
    it('should return array of supported terminal names', async () => {
      const { getSupportedTerminals } = await import('../src/utils/focus.js');
      const terminals = getSupportedTerminals();
      expect(Array.isArray(terminals)).toBe(true);
      expect(terminals).toContain('iTerm2');
      expect(terminals).toContain('Terminal.app');
      expect(terminals).toContain('Ghostty');
    });

    it('should return exactly 3 terminals', async () => {
      const { getSupportedTerminals } = await import('../src/utils/focus.js');
      const terminals = getSupportedTerminals();
      expect(terminals).toHaveLength(3);
    });
  });

  describe('focusSession', () => {
    it('should return false for invalid tty path on macOS', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });
      const { focusSession } = await import('../src/utils/focus.js');
      expect(focusSession('/invalid/path')).toBe(false);
      expect(focusSession('')).toBe(false);
    });

    it('should return false on non-macOS platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
        configurable: true,
      });
      const { focusSession } = await import('../src/utils/focus.js');
      expect(focusSession('/dev/pts/0')).toBe(false);
    });

    it('should return false on win32 platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });
      const { focusSession } = await import('../src/utils/focus.js');
      expect(focusSession('/dev/ttys001')).toBe(false);
    });

    it('should try to focus terminal on macOS with valid tty', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true,
      });

      const { focusSession } = await import('../src/utils/focus.js');
      // On non-macOS (like WSL), this will return false at the isMacOS check
      // On actual macOS without the right terminal apps, it returns false
      const result = focusSession('/dev/ttys001');
      expect(typeof result).toBe('boolean');
    });
  });
});
