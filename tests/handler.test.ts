import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_STORE_DIR = join(tmpdir(), `claude-monitor-handler-test-${process.pid}`);

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return {
    ...original,
    homedir: () => join(tmpdir(), `claude-monitor-handler-test-${process.pid}`),
  };
});

// Mock notify to avoid actual PowerShell calls
vi.mock('../src/utils/notify.js', () => ({
  notify: vi.fn(),
}));

describe('handler', () => {
  beforeEach(async () => {
    vi.resetModules();
    if (existsSync(TEST_STORE_DIR)) {
      rmSync(TEST_STORE_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_STORE_DIR, '.claude-monitor'), { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (existsSync(TEST_STORE_DIR)) {
      rmSync(TEST_STORE_DIR, { recursive: true, force: true });
    }
  });

  describe('VALID_HOOK_EVENTS', () => {
    it('should contain all expected hook event names', async () => {
      const { VALID_HOOK_EVENTS } = await import('../src/hook/handler.js');
      expect(VALID_HOOK_EVENTS.has('PreToolUse')).toBe(true);
      expect(VALID_HOOK_EVENTS.has('PostToolUse')).toBe(true);
      expect(VALID_HOOK_EVENTS.has('Notification')).toBe(true);
      expect(VALID_HOOK_EVENTS.has('Stop')).toBe(true);
      expect(VALID_HOOK_EVENTS.has('UserPromptSubmit')).toBe(true);
    });

    it('should have exactly 5 valid events', async () => {
      const { VALID_HOOK_EVENTS } = await import('../src/hook/handler.js');
      expect(VALID_HOOK_EVENTS.size).toBe(5);
    });
  });

  describe('isValidHookEventName', () => {
    it('should return true for valid event names', async () => {
      const { isValidHookEventName } = await import('../src/hook/handler.js');
      expect(isValidHookEventName('PreToolUse')).toBe(true);
      expect(isValidHookEventName('PostToolUse')).toBe(true);
      expect(isValidHookEventName('Notification')).toBe(true);
      expect(isValidHookEventName('Stop')).toBe(true);
      expect(isValidHookEventName('UserPromptSubmit')).toBe(true);
    });

    it('should return false for invalid event names', async () => {
      const { isValidHookEventName } = await import('../src/hook/handler.js');
      expect(isValidHookEventName('Invalid')).toBe(false);
      expect(isValidHookEventName('')).toBe(false);
      expect(isValidHookEventName('pretooluse')).toBe(false);
      expect(isValidHookEventName('PRETOOLUSE')).toBe(false);
      expect(isValidHookEventName('pre_tool_use')).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', async () => {
      const { isNonEmptyString } = await import('../src/hook/handler.js');
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(true);
      expect(isNonEmptyString('abc123')).toBe(true);
    });

    it('should return false for empty string', async () => {
      const { isNonEmptyString } = await import('../src/hook/handler.js');
      expect(isNonEmptyString('')).toBe(false);
    });

    it('should return false for non-string values', async () => {
      const { isNonEmptyString } = await import('../src/hook/handler.js');
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
      expect(isNonEmptyString(true)).toBe(false);
    });
  });

  describe('handleHookEvent', () => {
    let originalStdin: NodeJS.ReadableStream;
    let mockExit: ReturnType<typeof vi.spyOn>;
    let mockConsoleError: ReturnType<typeof vi.spyOn>;

    function mockStdin(data: string): void {
      const mockStream = new Readable({
        read() {
          this.push(Buffer.from(data));
          this.push(null);
        },
      });
      Object.defineProperty(process, 'stdin', {
        value: mockStream,
        writable: true,
        configurable: true,
      });
    }

    beforeEach(() => {
      originalStdin = process.stdin;
      mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit called');
      }) as never);
      mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      Object.defineProperty(process, 'stdin', {
        value: originalStdin,
        writable: true,
        configurable: true,
      });
      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should exit with error for invalid event name', async () => {
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('InvalidEvent')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid event name: InvalidEvent');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for invalid JSON input', async () => {
      mockStdin('invalid json {{{');
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('PreToolUse')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid JSON input');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for missing session_id', async () => {
      mockStdin(JSON.stringify({ cwd: '/tmp' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('PreToolUse')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid or missing session_id');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for invalid session_id type', async () => {
      mockStdin(JSON.stringify({ session_id: 123, cwd: '/tmp' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('PreToolUse')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid or missing session_id');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for invalid cwd type', async () => {
      mockStdin(JSON.stringify({ session_id: 'test', cwd: 123 }));
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('PreToolUse')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid cwd: must be a string');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for invalid notification_type type', async () => {
      mockStdin(JSON.stringify({ session_id: 'test', cwd: '/tmp', notification_type: 123 }));
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await expect(handleHookEvent('Notification')).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('Invalid notification_type: must be a string');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should process valid PreToolUse event', async () => {
      mockStdin(JSON.stringify({ session_id: 'test-session', cwd: '/home/user/project' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');
      const { getSession } = await import('../src/store/file-store.js');

      await handleHookEvent('PreToolUse', '/dev/pts/1');

      const session = getSession('test-session', '/dev/pts/1');
      expect(session).toBeDefined();
      expect(session?.status).toBe('running');
    });

    it('should process valid Stop event', async () => {
      // First create a session
      mockStdin(JSON.stringify({ session_id: 'test-session', cwd: '/home/user/project' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');
      await handleHookEvent('PreToolUse', '/dev/pts/1');

      // Reset stdin for Stop event
      mockStdin(JSON.stringify({ session_id: 'test-session', cwd: '/home/user/project' }));
      await handleHookEvent('Stop', '/dev/pts/1');

      const { getSession } = await import('../src/store/file-store.js');
      const session = getSession('test-session', '/dev/pts/1');
      expect(session).toBeDefined();
      expect(session?.status).toBe('stopped');
    });

    it('should process Notification with permission_prompt', async () => {
      mockStdin(
        JSON.stringify({
          session_id: 'test-session',
          cwd: '/home/user/project',
          notification_type: 'permission_prompt',
        })
      );
      const { handleHookEvent } = await import('../src/hook/handler.js');
      const { getSession } = await import('../src/store/file-store.js');

      await handleHookEvent('Notification', '/dev/pts/1');

      const session = getSession('test-session', '/dev/pts/1');
      expect(session).toBeDefined();
      expect(session?.status).toBe('waiting_input');
    });

    it('should use process.cwd() when cwd is not provided', async () => {
      mockStdin(JSON.stringify({ session_id: 'test-session' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');
      const { getSession } = await import('../src/store/file-store.js');

      await handleHookEvent('PreToolUse', '/dev/pts/1');

      const session = getSession('test-session', '/dev/pts/1');
      expect(session).toBeDefined();
      expect(session?.cwd).toBe(process.cwd());
    });

    it('should send notification on permission_prompt when enabled', async () => {
      // First enable notifications
      const { writeConfig } = await import('../src/utils/config.js');
      writeConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: true,
          onSessionComplete: true,
        },
      });

      mockStdin(
        JSON.stringify({
          session_id: 'test-session',
          cwd: '/home/user/project',
          notification_type: 'permission_prompt',
        })
      );
      const { handleHookEvent } = await import('../src/hook/handler.js');
      const { notify } = await import('../src/utils/notify.js');

      await handleHookEvent('Notification', '/dev/pts/1');

      expect(notify).toHaveBeenCalledWith('permission_prompt', '/home/user/project');
    });

    it('should send notification on Stop when enabled', async () => {
      // First enable notifications
      const { writeConfig } = await import('../src/utils/config.js');
      writeConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: true,
          onSessionComplete: true,
        },
      });

      mockStdin(JSON.stringify({ session_id: 'test-session', cwd: '/home/user/project' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');
      const { notify } = await import('../src/utils/notify.js');

      await handleHookEvent('Stop', '/dev/pts/1');

      expect(notify).toHaveBeenCalledWith('session_complete', '/home/user/project');
    });

    it('should not send notification when disabled', async () => {
      // Disable notifications
      const { writeConfig } = await import('../src/utils/config.js');
      writeConfig({
        notifications: {
          enabled: false,
          onPermissionPrompt: true,
          onSessionComplete: true,
        },
      });

      const { notify } = await import('../src/utils/notify.js');
      vi.mocked(notify).mockClear();

      mockStdin(
        JSON.stringify({
          session_id: 'test-session',
          cwd: '/home/user/project',
          notification_type: 'permission_prompt',
        })
      );
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await handleHookEvent('Notification', '/dev/pts/1');

      expect(notify).not.toHaveBeenCalled();
    });

    it('should not send notification when onPermissionPrompt is false', async () => {
      const { writeConfig } = await import('../src/utils/config.js');
      writeConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: false,
          onSessionComplete: true,
        },
      });

      const { notify } = await import('../src/utils/notify.js');
      vi.mocked(notify).mockClear();

      mockStdin(
        JSON.stringify({
          session_id: 'test-session',
          cwd: '/home/user/project',
          notification_type: 'permission_prompt',
        })
      );
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await handleHookEvent('Notification', '/dev/pts/1');

      expect(notify).not.toHaveBeenCalled();
    });

    it('should not send notification when onSessionComplete is false', async () => {
      const { writeConfig } = await import('../src/utils/config.js');
      writeConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: true,
          onSessionComplete: false,
        },
      });

      const { notify } = await import('../src/utils/notify.js');
      vi.mocked(notify).mockClear();

      mockStdin(JSON.stringify({ session_id: 'test-session', cwd: '/home/user/project' }));
      const { handleHookEvent } = await import('../src/hook/handler.js');

      await handleHookEvent('Stop', '/dev/pts/1');

      expect(notify).not.toHaveBeenCalled();
    });
  });
});
