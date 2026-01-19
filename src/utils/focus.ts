/**
 * Terminal focus utilities for Windows
 * Note: Terminal focus is not supported on Windows.
 * This module provides stub implementations for API compatibility.
 */

import { isValidWindowsTtyId } from './platform.js';

/**
 * Validate TTY identifier format (Windows format: win_<pid>)
 * @internal
 */
export function isValidTtyPath(tty: string): boolean {
  return isValidWindowsTtyId(tty);
}

/**
 * Check if the current platform is Windows
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}

/**
 * Focus a terminal session by TTY identifier
 * Note: Not supported on Windows - always returns false
 */
export function focusSession(_tty: string): boolean {
  // Terminal focus is not supported on Windows
  return false;
}

/**
 * Get list of supported terminals for focus feature
 * Note: Empty on Windows as focus is not supported
 */
export function getSupportedTerminals(): string[] {
  return [];
}
