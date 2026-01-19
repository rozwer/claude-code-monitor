import { spawnSync } from 'node:child_process';
import { MAX_TTY_CACHE_SIZE, TTY_CACHE_TTL_MS } from '../constants.js';
import { extractPidFromWindowsTtyId, isValidWindowsTtyId } from './platform.js';

// TTY check cache to avoid repeated process checks
const ttyCache = new Map<string, { alive: boolean; checkedAt: number }>();

/**
 * Evict oldest entries when cache exceeds max size
 * Uses FIFO eviction based on checkedAt timestamp
 */
function evictOldestIfNeeded(): void {
  if (ttyCache.size <= MAX_TTY_CACHE_SIZE) {
    return;
  }

  // Find and remove oldest entries until we're under the limit
  const entriesToRemove = ttyCache.size - MAX_TTY_CACHE_SIZE;
  const sortedEntries = [...ttyCache.entries()].sort((a, b) => a[1].checkedAt - b[1].checkedAt);

  for (let i = 0; i < entriesToRemove; i++) {
    ttyCache.delete(sortedEntries[i][0]);
  }
}

/**
 * Check if a Windows process is still running
 * Uses tasklist command to check process existence
 */
function isProcessAlive(pid: number): boolean {
  // Only run tasklist on actual Windows
  if (process.platform !== 'win32') {
    // On non-Windows (e.g., WSL testing), assume alive
    return true;
  }

  try {
    const result = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/NH'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    // tasklist returns the process info if found, or "INFO: No tasks are running..."
    return result.status === 0 && !result.stdout.includes('INFO:');
  } catch {
    // If tasklist fails, assume the process is alive to avoid false negatives
    return true;
  }
}

/**
 * Check if a TTY/session identifier is still alive
 * For Windows: checks if the parent process is still running
 * Results are cached for TTY_CACHE_TTL_MS to avoid repeated checks
 * @internal
 */
export function isTtyAlive(tty: string | undefined): boolean {
  if (!tty) return true; // Treat unknown TTY as alive

  const now = Date.now();
  const cached = ttyCache.get(tty);

  // Return cached result if still valid
  if (cached && now - cached.checkedAt < TTY_CACHE_TTL_MS) {
    return cached.alive;
  }

  // Check TTY and cache result
  let alive: boolean;

  if (isValidWindowsTtyId(tty)) {
    // Windows: check if parent process is still running
    const pid = extractPidFromWindowsTtyId(tty);
    alive = pid !== undefined && isProcessAlive(pid);
  } else {
    // Unknown format: assume alive
    alive = true;
  }

  ttyCache.set(tty, { alive, checkedAt: now });
  evictOldestIfNeeded();
  return alive;
}

/**
 * Clear the TTY cache (useful for testing)
 * @internal
 */
export function clearTtyCache(): void {
  ttyCache.clear();
}
