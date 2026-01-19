import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HookEvent, Session, StoreData } from '../src/types/index.js';

const TEST_STORE_DIR = join(tmpdir(), `claude-monitor-test-${process.pid}`);

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return {
    ...original,
    homedir: () => join(tmpdir(), `claude-monitor-test-${process.pid}`),
  };
});

// Mock isTtyAlive to return true for most TTYs, but false for specific test paths
vi.mock('../src/utils/tty-cache.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utils/tty-cache.js')>();
  return {
    ...original,
    isTtyAlive: (tty: string | undefined) => {
      if (!tty) return true;
      // Return false for TTYs that are explicitly meant to not exist in tests
      if (tty === '/dev/ttys999') return false;
      // All other TTYs are treated as alive (for CI compatibility)
      return true;
    },
  };
});

describe('file-store', () => {
  beforeEach(async () => {
    // Reset in-memory cache before each test
    const { resetStoreCache } = await import('../src/store/file-store.js');
    resetStoreCache();

    if (existsSync(TEST_STORE_DIR)) {
      rmSync(TEST_STORE_DIR, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Flush and reset cache after each test
    const { flushPendingWrites, resetStoreCache } = await import('../src/store/file-store.js');
    flushPendingWrites();
    resetStoreCache();

    vi.restoreAllMocks();
    if (existsSync(TEST_STORE_DIR)) {
      rmSync(TEST_STORE_DIR, { recursive: true, force: true });
    }
  });

  describe('getSessionKey', () => {
    it('should return session_id only (ignoring tty)', async () => {
      const { getSessionKey } = await import('../src/store/file-store.js');
      // TTY is no longer part of the key - session_id is always used alone
      expect(getSessionKey('abc123', '/dev/ttys001')).toBe('abc123');
      expect(getSessionKey('abc123')).toBe('abc123');
      expect(getSessionKey('abc123', undefined)).toBe('abc123');
    });
  });

  describe('isTtyAlive', () => {
    it('should return true when tty is undefined', async () => {
      const { isTtyAlive } = await import('../src/store/file-store.js');
      expect(isTtyAlive(undefined)).toBe(true);
    });

    it('should return false when tty does not exist', async () => {
      const { isTtyAlive } = await import('../src/store/file-store.js');
      expect(isTtyAlive('/dev/ttys999')).toBe(false);
    });

    it('should return true when tty exists', async () => {
      const { isTtyAlive } = await import('../src/store/file-store.js');
      // /dev/null always exists
      expect(isTtyAlive('/dev/null')).toBe(true);
    });
  });

  describe('determineStatus', () => {
    it('should return stopped on Stop event', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'Stop',
      };
      expect(determineStatus(event)).toBe('stopped');
      expect(determineStatus(event, 'running')).toBe('stopped');
      expect(determineStatus(event, 'waiting_input')).toBe('stopped');
    });

    it('should return running on UserPromptSubmit event even if stopped', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'UserPromptSubmit',
      };
      expect(determineStatus(event, 'stopped')).toBe('running');
      expect(determineStatus(event, 'running')).toBe('running');
    });

    it('should keep stopped state for other events', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'PostToolUse',
      };
      expect(determineStatus(event, 'stopped')).toBe('stopped');
    });

    it('should return running on PreToolUse event', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'PreToolUse',
      };
      expect(determineStatus(event)).toBe('running');
      expect(determineStatus(event, 'waiting_input')).toBe('running');
    });

    it('should return waiting_input on Notification with permission_prompt', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'Notification',
        notification_type: 'permission_prompt',
      };
      expect(determineStatus(event)).toBe('waiting_input');
    });

    it('should return running on Notification without permission_prompt', async () => {
      const { determineStatus } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'test',
        cwd: '/tmp',
        hook_event_name: 'Notification',
        notification_type: 'other',
      };
      expect(determineStatus(event)).toBe('running');
    });
  });

  describe('removeOldSessionsOnSameTty', () => {
    it('should remove sessions with same tty but different session_id', async () => {
      const { removeOldSessionsOnSameTty } = await import('../src/store/file-store.js');
      const sessions: Record<string, Session> = {
        old: {
          session_id: 'old',
          cwd: '/tmp',
          tty: '/dev/ttys001',
          status: 'running',
          updated_at: new Date().toISOString(),
        },
        other: {
          session_id: 'other',
          cwd: '/tmp',
          tty: '/dev/ttys002',
          status: 'running',
          updated_at: new Date().toISOString(),
        },
      };

      removeOldSessionsOnSameTty(sessions, 'new', '/dev/ttys001');

      expect(sessions.old).toBeUndefined();
      expect(sessions.other).toBeDefined();
    });

    it('should not remove session with same session_id', async () => {
      const { removeOldSessionsOnSameTty } = await import('../src/store/file-store.js');
      const sessions: Record<string, Session> = {
        same: {
          session_id: 'same',
          cwd: '/tmp',
          tty: '/dev/ttys001',
          status: 'running',
          updated_at: new Date().toISOString(),
        },
      };

      removeOldSessionsOnSameTty(sessions, 'same', '/dev/ttys001');

      expect(sessions.same).toBeDefined();
    });
  });

  describe('readStore and writeStore', () => {
    it('should return empty store data when file does not exist', async () => {
      const { readStore } = await import('../src/store/file-store.js');
      const data = readStore();

      expect(data.sessions).toEqual({});
      expect(data.updated_at).toBeDefined();
    });

    it('should read and write store data correctly', async () => {
      const { readStore, writeStore } = await import('../src/store/file-store.js');
      const testData: StoreData = {
        sessions: {
          test: {
            session_id: 'test',
            cwd: '/tmp',
            tty: '/dev/ttys001',
            status: 'running',
            updated_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      };

      writeStore(testData);
      const readData = readStore();

      expect(readData.sessions.test).toBeDefined();
      expect(readData.sessions.test.session_id).toBe('test');
    });

    it('should return empty store data when file contains invalid JSON', async () => {
      mkdirSync(join(TEST_STORE_DIR, '.claude-monitor'), { recursive: true });
      writeFileSync(
        join(TEST_STORE_DIR, '.claude-monitor', 'sessions.json'),
        'invalid json',
        'utf-8'
      );

      const { readStore } = await import('../src/store/file-store.js');
      const data = readStore();

      expect(data.sessions).toEqual({});
    });
  });

  describe('updateSession', () => {
    it('should create new session', async () => {
      const { updateSession, getSession } = await import('../src/store/file-store.js');
      const event: HookEvent = {
        session_id: 'new-session',
        cwd: '/home/user/project',
        tty: '/dev/ttys001',
        hook_event_name: 'PreToolUse',
      };

      const session = updateSession(event);

      expect(session.session_id).toBe('new-session');
      expect(session.cwd).toBe('/home/user/project');
      expect(session.tty).toBe('/dev/ttys001');
      expect(session.status).toBe('running');

      const stored = getSession('new-session', '/dev/ttys001');
      expect(stored).toBeDefined();
      expect(stored?.session_id).toBe('new-session');
    });

    it('should update existing session status', async () => {
      const { updateSession, getSession } = await import('../src/store/file-store.js');

      updateSession({
        session_id: 'test',
        cwd: '/tmp',
        tty: '/dev/ttys001',
        hook_event_name: 'PreToolUse',
      });

      updateSession({
        session_id: 'test',
        cwd: '/tmp',
        tty: '/dev/ttys001',
        hook_event_name: 'Notification',
        notification_type: 'permission_prompt',
      });

      const session = getSession('test', '/dev/ttys001');
      expect(session?.status).toBe('waiting_input');
    });
  });

  describe('getSessions', () => {
    it('should return sessions sorted by created_at asc', async () => {
      const { writeStore, getSessions } = await import('../src/store/file-store.js');
      const now = Date.now();

      writeStore({
        sessions: {
          old: {
            session_id: 'old',
            cwd: '/tmp',
            tty: '/dev/ttys001',
            status: 'running',
            created_at: new Date(now - 1000).toISOString(),
            updated_at: new Date(now).toISOString(),
          },
          new: {
            session_id: 'new',
            cwd: '/tmp',
            tty: '/dev/ttys002',
            status: 'running',
            created_at: new Date(now).toISOString(),
            updated_at: new Date(now - 1000).toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      });

      const sessions = getSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].session_id).toBe('old');
      expect(sessions[1].session_id).toBe('new');
    });

    it('should remove expired sessions', async () => {
      const { writeStore, getSessions } = await import('../src/store/file-store.js');
      const now = Date.now();
      const thirtyOneMinutesAgo = now - 31 * 60 * 1000;

      writeStore({
        sessions: {
          expired: {
            session_id: 'expired',
            cwd: '/tmp',
            tty: '/dev/ttys001',
            status: 'running',
            updated_at: new Date(thirtyOneMinutesAgo).toISOString(),
          },
          active: {
            session_id: 'active',
            cwd: '/tmp',
            tty: '/dev/ttys002',
            status: 'running',
            updated_at: new Date(now).toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      });

      const sessions = getSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].session_id).toBe('active');
    });
  });

  describe('removeSession', () => {
    it('should remove session by key', async () => {
      const { updateSession, removeSession, getSession } = await import(
        '../src/store/file-store.js'
      );

      updateSession({
        session_id: 'test',
        cwd: '/tmp',
        tty: '/dev/ttys001',
        hook_event_name: 'PreToolUse',
      });

      expect(getSession('test', '/dev/ttys001')).toBeDefined();

      removeSession('test', '/dev/ttys001');

      expect(getSession('test', '/dev/ttys001')).toBeUndefined();
    });
  });

  describe('clearSessions', () => {
    it('should remove all sessions', async () => {
      const { updateSession, clearSessions, getSessions } = await import(
        '../src/store/file-store.js'
      );

      updateSession({
        session_id: 'test1',
        cwd: '/tmp',
        hook_event_name: 'PreToolUse',
      });
      updateSession({
        session_id: 'test2',
        cwd: '/tmp',
        hook_event_name: 'PreToolUse',
      });

      expect(getSessions()).toHaveLength(2);

      clearSessions();

      expect(getSessions()).toHaveLength(0);
    });
  });

  describe('getStorePath', () => {
    it('should return store file path', async () => {
      const { getStorePath } = await import('../src/store/file-store.js');
      const path = getStorePath();

      expect(path).toContain('sessions.json');
      expect(path).toContain('.claude-monitor');
    });
  });

  describe('flushPendingWrites', () => {
    it('should do nothing when no pending writes', async () => {
      const { flushPendingWrites, resetStoreCache } = await import('../src/store/file-store.js');
      resetStoreCache();

      // Should not throw when there are no pending writes
      expect(() => flushPendingWrites()).not.toThrow();
    });

    it('should flush pending data immediately', async () => {
      const { writeStore, flushPendingWrites, readStore, resetStoreCache } = await import(
        '../src/store/file-store.js'
      );
      resetStoreCache();

      const testData = {
        sessions: {
          'test-pts1': {
            session_id: 'test',
            cwd: '/tmp',
            tty: '/dev/pts/1',
            status: 'running' as const,
            updated_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      };

      writeStore(testData);
      flushPendingWrites();

      // Reset cache to force read from file
      resetStoreCache();
      const data = readStore();
      expect(data.sessions['test-pts1']).toBeDefined();
    });
  });

  describe('resetStoreCache', () => {
    it('should cancel pending writes', async () => {
      const { writeStore, resetStoreCache, readStore } = await import('../src/store/file-store.js');
      resetStoreCache();

      const testData = {
        sessions: {
          'test-pts1': {
            session_id: 'test',
            cwd: '/tmp',
            tty: '/dev/pts/1',
            status: 'running' as const,
            updated_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      };

      writeStore(testData);
      // Reset before debounce timer fires
      resetStoreCache();

      // Wait for debounce time to pass
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Data should not be written since we reset the cache
      const data = readStore();
      expect(data.sessions['test-pts1']).toBeUndefined();
    });

    it('should clear cached data', async () => {
      const { writeStore, resetStoreCache, readStore } = await import('../src/store/file-store.js');
      resetStoreCache();

      const testData = {
        sessions: {},
        updated_at: new Date().toISOString(),
      };

      writeStore(testData);
      resetStoreCache();

      // After reset, reading should return empty store (not cached data)
      const data = readStore();
      expect(data.sessions).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle flushPendingWrites when no write timer exists', async () => {
      const { flushPendingWrites, resetStoreCache } = await import('../src/store/file-store.js');
      resetStoreCache();

      // Call flushPendingWrites when there's no pending write
      // This tests the writeTimer null check path
      expect(() => flushPendingWrites()).not.toThrow();
    });
  });
});
