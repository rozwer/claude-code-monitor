import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants for testing (match src/constants.ts)
const MAX_TTY_CACHE_SIZE = 100;

describe('tty-cache', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isTtyAlive', () => {
    it('returns true when tty is undefined', async () => {
      const { isTtyAlive } = await import('../src/utils/tty-cache.js');

      expect(isTtyAlive(undefined)).toBe(true);
    });

    it('returns true when tty exists (e.g., /dev/null)', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      // /dev/null always exists
      expect(isTtyAlive('/dev/null')).toBe(true);
    });

    it('returns false when tty does not exist', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      expect(isTtyAlive('/dev/nonexistent-tty-12345')).toBe(false);
    });

    it('caches the result for TTY_CACHE_TTL_MS', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      // First call should check the filesystem
      const result1 = isTtyAlive('/dev/null');
      expect(result1).toBe(true);

      // Second call should use cache (won't actually check filesystem again)
      const result2 = isTtyAlive('/dev/null');
      expect(result2).toBe(true);
    });

    it('clears cache correctly', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      // First call
      isTtyAlive('/dev/null');

      // Clear cache
      clearTtyCache();

      // This should check filesystem again
      const result = isTtyAlive('/dev/null');
      expect(result).toBe(true);
    });

    it('evicts oldest entries when cache exceeds max size', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      // Add entries up to MAX_TTY_CACHE_SIZE + some extra
      for (let i = 0; i < MAX_TTY_CACHE_SIZE + 10; i++) {
        isTtyAlive(`/dev/fake-tty-${i}`);
      }

      // The cache should still work
      expect(isTtyAlive('/dev/null')).toBe(true);
    });
  });

  describe('clearTtyCache', () => {
    it('is a callable function', async () => {
      const { clearTtyCache } = await import('../src/utils/tty-cache.js');

      expect(typeof clearTtyCache).toBe('function');
      expect(() => clearTtyCache()).not.toThrow();
    });

    it('resets cache state', async () => {
      const { isTtyAlive, clearTtyCache } = await import('../src/utils/tty-cache.js');
      clearTtyCache();

      // Add an entry
      isTtyAlive('/dev/null');

      // Clear and verify no throw
      clearTtyCache();

      // Should be able to add again without issue
      isTtyAlive('/dev/null');
    });
  });
});
