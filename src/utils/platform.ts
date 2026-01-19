/**
 * Platform detection utilities for Windows-only build
 */

/**
 * Check if the current platform is Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Generate a Windows-compatible session identifier
 * Since Windows doesn't have /dev/tty*, we use process ID based identifiers
 */
export function generateWindowsTtyId(): string {
  return `win_${process.ppid}`;
}

/**
 * Validate Windows TTY identifier format
 * Format: win_<process_id>
 */
export function isValidWindowsTtyId(tty: string): boolean {
  return /^win_\d+$/.test(tty);
}
