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
 * Build PowerShell script to focus terminal window
 * Tries Windows Terminal first, then PowerShell/Command Prompt
 */
function buildFocusScript(targetApp?: string): string {
  const safeApp = targetApp ? escapePowerShell(targetApp) : '';

  // Script to bring terminal window to foreground
  return `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowHelper {
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

function Focus-Window($processName) {
  $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($proc -and $proc.MainWindowHandle -ne 0) {
    [WindowHelper]::ShowWindow($proc.MainWindowHandle, 9) # SW_RESTORE
    [WindowHelper]::SetForegroundWindow($proc.MainWindowHandle)
    return $true
  }
  return $false
}

# Try to focus the terminal in priority order
$focused = $false
${safeApp ? `$focused = Focus-Window '${safeApp}'` : ''}
if (-not $focused) { $focused = Focus-Window 'WindowsTerminal' }
if (-not $focused) { $focused = Focus-Window 'powershell' }
if (-not $focused) { $focused = Focus-Window 'pwsh' }
if (-not $focused) { Focus-Window 'cmd' }
`;
}

/**
 * Focus the terminal window
 */
export function focusTerminalWindow(
  targetApp?: string,
  callback?: (error: Error | null) => void
): void {
  const psPath = getPowerShellPath();
  if (!psPath) {
    callback?.(new Error('PowerShell not available'));
    return;
  }

  const script = buildFocusScript(targetApp);

  execFile(
    psPath,
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { timeout: 5000, windowsHide: true },
    (error) => {
      callback?.(error);
    }
  );
}

/**
 * Send Windows Toast notification via PowerShell
 * Uses BurntToast if available, falls back to basic notification
 * When clicked, focuses the terminal window
 */
export function sendWindowsNotification(
  title: string,
  message: string,
  callback?: (error: Error | null) => void,
  options?: { focusOnClick?: boolean }
): void {
  const psPath = getPowerShellPath();
  if (!psPath) {
    callback?.(new Error('PowerShell not available'));
    return;
  }

  const safeTitle = escapePowerShell(title);
  const safeMessage = escapePowerShell(message);
  const focusOnClick = options?.focusOnClick ?? true;

  // Build BurntToast script with click action
  const burntToastWithAction = focusOnClick
    ? `
$action = New-BTAction -ActivationType Protocol -Arguments 'claude-monitor:focus'
New-BurntToastNotification -Text '${safeTitle}', '${safeMessage}' -Button (New-BTButton -Content 'Open' -Arguments 'claude-monitor:focus' -ActivationType Protocol)
`
    : `New-BurntToastNotification -Text '${safeTitle}', '${safeMessage}'`;

  // Use Windows notification via PowerShell
  // Try BurntToast first, fall back to basic balloon notification
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
try {
  if (Get-Command New-BurntToastNotification -ErrorAction SilentlyContinue) {
    ${burntToastWithAction}
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
 * Send notification and immediately focus terminal
 * This is the recommended way to notify users who need to take action
 */
export function sendNotificationWithFocus(
  title: string,
  message: string,
  callback?: (error: Error | null) => void
): void {
  sendWindowsNotification(title, message, (notifyError) => {
    // After showing notification, also focus the terminal
    focusTerminalWindow(undefined, (focusError) => {
      callback?.(notifyError || focusError);
    });
  });
}

/**
 * Notification types
 */
export type NotificationType = 'permission_prompt' | 'session_complete';

/**
 * Send notification based on type
 * For permission_prompt, also focuses the terminal window immediately
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

  // For permission prompts, show notification AND focus terminal immediately
  // This ensures user can respond quickly
  if (type === 'permission_prompt') {
    sendNotificationWithFocus(title, message);
  } else {
    sendWindowsNotification(title, message);
  }
}
