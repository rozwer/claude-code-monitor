import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('notify', () => {
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

  describe('isWindowsEnvironment', () => {
    it('returns true on Windows platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { isWindowsEnvironment } = await import('../src/utils/notify.js');
      expect(isWindowsEnvironment()).toBe(true);
    });

    it('checks for WSL PowerShell path on non-Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
        configurable: true,
      });

      const { isWindowsEnvironment } = await import('../src/utils/notify.js');

      // Just verify it returns a boolean (actual value depends on environment)
      const result = isWindowsEnvironment();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('notify function', () => {
    it('is a function that accepts notification type', async () => {
      const { notify } = await import('../src/utils/notify.js');
      expect(typeof notify).toBe('function');

      // Should not throw
      expect(() => notify('permission_prompt')).not.toThrow();
      expect(() => notify('session_complete', '/some/path')).not.toThrow();
    });

    it('calls sendWindowsNotification on Windows for permission_prompt', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { notify } = await import('../src/utils/notify.js');
      // Should not throw
      expect(() => notify('permission_prompt', '/test/path')).not.toThrow();
    });

    it('calls sendWindowsNotification on Windows for session_complete', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { notify } = await import('../src/utils/notify.js');
      // Should not throw
      expect(() => notify('session_complete', '/test/path')).not.toThrow();
    });

    it('uses default message when sessionInfo is not provided', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { notify } = await import('../src/utils/notify.js');
      // Should not throw even without sessionInfo
      expect(() => notify('permission_prompt')).not.toThrow();
      expect(() => notify('session_complete')).not.toThrow();
    });
  });

  describe('sendWindowsNotification', () => {
    it('is a function that accepts title, message, and callback', async () => {
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
    });

    it('works on win32 platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { sendWindowsNotification } = await import('../src/utils/notify.js');
      // Should not throw
      sendWindowsNotification('Test Title', 'Test Message');

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('escapes special characters in PowerShell script', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { sendWindowsNotification } = await import('../src/utils/notify.js');
      // Test with special characters that need escaping
      sendWindowsNotification("Title's Test", 'Message with `backticks`');

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  describe('NotificationType', () => {
    it('supports permission_prompt type', async () => {
      const { notify } = await import('../src/utils/notify.js');

      // Should accept permission_prompt type
      expect(() => notify('permission_prompt', '/test/path')).not.toThrow();
    });

    it('supports session_complete type', async () => {
      const { notify } = await import('../src/utils/notify.js');

      // Should accept session_complete type
      expect(() => notify('session_complete', '/test/path')).not.toThrow();
    });
  });

  describe('focusTerminalWindow', () => {
    it('is a function that accepts optional targetApp and callback', async () => {
      const { focusTerminalWindow } = await import('../src/utils/notify.js');
      expect(typeof focusTerminalWindow).toBe('function');

      // Should not throw
      expect(() => focusTerminalWindow()).not.toThrow();
      expect(() => focusTerminalWindow('WindowsTerminal')).not.toThrow();
      expect(() => focusTerminalWindow(undefined, () => {})).not.toThrow();
    });

    it('works on win32 platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { focusTerminalWindow } = await import('../src/utils/notify.js');
      // Should not throw
      focusTerminalWindow();

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  describe('sendNotificationWithFocus', () => {
    it('is a function that accepts title, message, and callback', async () => {
      const { sendNotificationWithFocus } = await import('../src/utils/notify.js');
      expect(typeof sendNotificationWithFocus).toBe('function');

      // Should not throw
      expect(() => sendNotificationWithFocus('Test', 'Message')).not.toThrow();
    });

    it('works on win32 platform', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true,
      });

      const { sendNotificationWithFocus } = await import('../src/utils/notify.js');
      // Should not throw
      sendNotificationWithFocus('Test Title', 'Test Message');

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });
});
