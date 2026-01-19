import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../src/types/index.js';

const TEST_CONFIG_DIR = join(tmpdir(), `claude-monitor-config-test-${process.pid}`);
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, '.claude-monitor', 'config.json');

vi.mock('node:os', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:os')>();
  return {
    ...original,
    homedir: () => join(tmpdir(), `claude-monitor-config-test-${process.pid}`),
  };
});

describe('config', () => {
  beforeEach(() => {
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
  });

  describe('readConfig', () => {
    it('returns default config when no config file exists', async () => {
      const { readConfig } = await import('../src/utils/config.js');
      const config = readConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('reads existing config file', async () => {
      const { readConfig } = await import('../src/utils/config.js');

      // Create config directory and file
      const configDir = join(TEST_CONFIG_DIR, '.claude-monitor');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({
          notifications: {
            enabled: true,
            onPermissionPrompt: false,
            onSessionComplete: true,
          },
        })
      );

      const config = readConfig();
      expect(config.notifications.enabled).toBe(true);
      expect(config.notifications.onPermissionPrompt).toBe(false);
      expect(config.notifications.onSessionComplete).toBe(true);
    });

    it('merges with defaults for partial config', async () => {
      const { readConfig } = await import('../src/utils/config.js');

      const configDir = join(TEST_CONFIG_DIR, '.claude-monitor');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(
        TEST_CONFIG_FILE,
        JSON.stringify({
          notifications: {
            enabled: true,
          },
        })
      );

      const config = readConfig();
      expect(config.notifications.enabled).toBe(true);
      // Should have default values for missing fields
      expect(config.notifications.onPermissionPrompt).toBe(true);
      expect(config.notifications.onSessionComplete).toBe(true);
    });

    it('returns default config for invalid JSON', async () => {
      const { readConfig } = await import('../src/utils/config.js');

      const configDir = join(TEST_CONFIG_DIR, '.claude-monitor');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, 'invalid json {{{');

      const config = readConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('writeConfig', () => {
    it('writes config file', async () => {
      const { writeConfig, readConfig } = await import('../src/utils/config.js');

      writeConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: true,
          onSessionComplete: false,
        },
      });

      expect(existsSync(TEST_CONFIG_FILE)).toBe(true);

      const config = readConfig();
      expect(config.notifications.enabled).toBe(true);
      expect(config.notifications.onSessionComplete).toBe(false);
    });

    it('creates config directory if not exists', async () => {
      const { writeConfig } = await import('../src/utils/config.js');

      writeConfig(DEFAULT_CONFIG);

      expect(existsSync(join(TEST_CONFIG_DIR, '.claude-monitor'))).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('updates existing config', async () => {
      const { updateConfig, readConfig } = await import('../src/utils/config.js');

      // Initial write
      updateConfig({
        notifications: {
          enabled: true,
          onPermissionPrompt: true,
          onSessionComplete: true,
        },
      });

      // Partial update
      updateConfig({
        notifications: {
          enabled: false,
          onPermissionPrompt: true,
          onSessionComplete: true,
        },
      });

      const config = readConfig();
      expect(config.notifications.enabled).toBe(false);
    });
  });

  describe('getConfigPath', () => {
    it('returns config file path', async () => {
      const { getConfigPath } = await import('../src/utils/config.js');
      const path = getConfigPath();
      expect(path).toContain('.claude-monitor');
      expect(path).toContain('config.json');
    });
  });
});
