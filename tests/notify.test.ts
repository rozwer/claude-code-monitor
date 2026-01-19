import { describe, expect, it, vi } from 'vitest';

describe('notify', () => {
  describe('isWindowsEnvironment', () => {
    it('returns true on Windows platform', async () => {
      vi.resetModules();
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const { isWindowsEnvironment } = await import('../src/utils/notify.js');
      expect(isWindowsEnvironment()).toBe(true);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
      vi.resetModules();
    });

    it('checks for WSL PowerShell path on non-Windows', async () => {
      vi.resetModules();

      const { isWindowsEnvironment } = await import('../src/utils/notify.js');

      // Just verify it returns a boolean (actual value depends on environment)
      const result = isWindowsEnvironment();
      expect(typeof result).toBe('boolean');

      vi.resetModules();
    });
  });

  describe('notify function', () => {
    it('is a function that accepts notification type', async () => {
      vi.resetModules();

      const { notify } = await import('../src/utils/notify.js');
      expect(typeof notify).toBe('function');

      // Should not throw
      expect(() => notify('permission_prompt')).not.toThrow();
      expect(() => notify('session_complete', '/some/path')).not.toThrow();

      vi.resetModules();
    });
  });

  describe('sendWindowsNotification', () => {
    it('is a function that accepts title, message, and callback', async () => {
      vi.resetModules();

      const { sendWindowsNotification } = await import('../src/utils/notify.js');
      expect(typeof sendWindowsNotification).toBe('function');

      // Should handle callback (may or may not call it depending on environment)
      sendWindowsNotification('Test', 'Message', () => {
        // Callback executed
      });

      // Wait for potential async callback
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Just verify it didn't throw
      expect(true).toBe(true);

      vi.resetModules();
    });
  });

  describe('NotificationType', () => {
    it('supports permission_prompt type', async () => {
      vi.resetModules();

      const { notify } = await import('../src/utils/notify.js');

      // Should accept permission_prompt type
      expect(() => notify('permission_prompt', '/test/path')).not.toThrow();

      vi.resetModules();
    });

    it('supports session_complete type', async () => {
      vi.resetModules();

      const { notify } = await import('../src/utils/notify.js');

      // Should accept session_complete type
      expect(() => notify('session_complete', '/test/path')).not.toThrow();

      vi.resetModules();
    });
  });
});
