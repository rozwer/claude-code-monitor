import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { type Config, DEFAULT_CONFIG } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.claude-monitor');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function readConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(content) as Partial<Config>;
    // Merge with defaults to ensure all fields exist
    return {
      notifications: {
        ...DEFAULT_CONFIG.notifications,
        ...parsed.notifications,
      },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function writeConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

export function updateConfig(updates: Partial<Config>): Config {
  const current = readConfig();
  const updated: Config = {
    ...current,
    ...updates,
    notifications: {
      ...current.notifications,
      ...updates.notifications,
    },
  };
  writeConfig(updated);
  return updated;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
