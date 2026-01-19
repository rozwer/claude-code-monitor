import { describe, expect, it } from 'vitest';
import {
  focusSession,
  getSupportedTerminals,
  isValidTtyPath,
  isWindows,
} from '../src/utils/focus.js';
import { generateWindowsTtyId, isValidWindowsTtyId } from '../src/utils/platform.js';

describe('focus (Windows)', () => {
  describe('isValidTtyPath', () => {
    it('should accept valid Windows TTY identifiers', () => {
      expect(isValidTtyPath('win_1234')).toBe(true);
      expect(isValidTtyPath('win_0')).toBe(true);
      expect(isValidTtyPath('win_99999')).toBe(true);
    });

    it('should reject invalid Windows TTY identifiers', () => {
      expect(isValidTtyPath('')).toBe(false);
      expect(isValidTtyPath('win_')).toBe(false);
      expect(isValidTtyPath('win_abc')).toBe(false);
      expect(isValidTtyPath('linux_1234')).toBe(false);
      expect(isValidTtyPath('1234')).toBe(false);
    });

    it('should reject Unix-style TTY paths (not supported on Windows)', () => {
      expect(isValidTtyPath('/dev/ttys000')).toBe(false);
      expect(isValidTtyPath('/dev/pts/0')).toBe(false);
      expect(isValidTtyPath('/dev/tty0')).toBe(false);
    });
  });

  describe('isWindows', () => {
    it('should return boolean based on platform', () => {
      const result = isWindows();
      expect(typeof result).toBe('boolean');
      // This test runs on the current platform
      expect(result).toBe(process.platform === 'win32');
    });
  });

  describe('getSupportedTerminals', () => {
    it('should return empty array (focus not supported on Windows)', () => {
      const terminals = getSupportedTerminals();
      expect(Array.isArray(terminals)).toBe(true);
      expect(terminals).toHaveLength(0);
    });
  });

  describe('focusSession', () => {
    it('should always return false (focus not supported on Windows)', () => {
      expect(focusSession('win_1234')).toBe(false);
      expect(focusSession('win_0')).toBe(false);
      expect(focusSession('')).toBe(false);
    });
  });
});

describe('platform utilities', () => {
  describe('generateWindowsTtyId', () => {
    it('should generate valid Windows TTY identifier', () => {
      const ttyId = generateWindowsTtyId();
      expect(ttyId).toMatch(/^win_\d+$/);
    });

    it('should include parent process ID', () => {
      const ttyId = generateWindowsTtyId();
      expect(ttyId).toBe(`win_${process.ppid}`);
    });
  });

  describe('isValidWindowsTtyId', () => {
    it('should validate Windows TTY identifier format', () => {
      expect(isValidWindowsTtyId('win_1234')).toBe(true);
      expect(isValidWindowsTtyId('win_0')).toBe(true);
      expect(isValidWindowsTtyId('win_')).toBe(false);
      expect(isValidWindowsTtyId('win_abc')).toBe(false);
      expect(isValidWindowsTtyId('')).toBe(false);
    });
  });
});
