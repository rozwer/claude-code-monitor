import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Check if running on Windows (native or WSL)
 */
export function isWindowsEnvironment(): boolean {
  // Native Windows
  if (process.platform === 'win32') {
    return true;
  }
  // WSL - check for Windows interop
  return existsSync('/mnt/c/Windows/System32/WindowsPowerShell');
}

/**
 * Get PowerShell executable path
 */
function getPowerShellPath(): string | null {
  if (process.platform === 'win32') {
    return 'powershell.exe';
  }
  // WSL path
  const wslPath = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
  if (existsSync(wslPath)) {
    return wslPath;
  }
  return null;
}

/**
 * Escape string for PowerShell
 */
function escapePowerShell(str: string): string {
  return str.replace(/'/g, "''").replace(/`/g, '``');
}

/**
 * Send Windows Toast notification via PowerShell
 * Uses BurntToast if available, falls back to basic notification
 */
export function sendWindowsNotification(
  title: string,
  message: string,
  callback?: (error: Error | null) => void
): void {
  const psPath = getPowerShellPath();
  if (!psPath) {
    callback?.(new Error('PowerShell not available'));
    return;
  }

  const safeTitle = escapePowerShell(title);
  const safeMessage = escapePowerShell(message);

  // Use Windows notification via PowerShell
  // Try BurntToast first, fall back to basic balloon notification
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
try {
  if (Get-Command New-BurntToastNotification -ErrorAction SilentlyContinue) {
    New-BurntToastNotification -Text '${safeTitle}', '${safeMessage}'
  } else {
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Visible = $true
    $notify.ShowBalloonTip(5000, '${safeTitle}', '${safeMessage}', 'Info')
    Start-Sleep -Milliseconds 100
    $notify.Dispose()
  }
} catch {
  # Silently fail
}
`;

  execFile(
    psPath,
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: 10000, windowsHide: true },
    (error) => {
      callback?.(error);
    }
  );
}

/**
 * Notification types
 */
export type NotificationType = 'permission_prompt' | 'session_complete';

/**
 * Send notification based on type
 */
export function notify(type: NotificationType, sessionInfo?: string): void {
  if (!isWindowsEnvironment()) {
    return;
  }

  let title: string;
  let message: string;

  switch (type) {
    case 'permission_prompt':
      title = 'Claude Code - Permission Required';
      message = sessionInfo
        ? `Session in ${sessionInfo} needs your attention`
        : 'A session is waiting for permission';
      break;
    case 'session_complete':
      title = 'Claude Code - Session Complete';
      message = sessionInfo ? `Session in ${sessionInfo} has finished` : 'A session has completed';
      break;
  }

  sendWindowsNotification(title, message);
}
