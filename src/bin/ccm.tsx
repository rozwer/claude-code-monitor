#!/usr/bin/env node
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { Command } from 'commander';
import { render } from 'ink';
import { Dashboard } from '../components/Dashboard.js';
import { handleHookEvent } from '../hook/handler.js';
import { isHooksConfigured, setupHooks } from '../setup/index.js';
import { clearSessions, getSessions } from '../store/file-store.js';
import { getConfigPath, readConfig, updateConfig } from '../utils/config.js';
import { generateWindowsTtyId } from '../utils/platform.js';
import { getStatusDisplay } from '../utils/status.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

// Alternate screen buffer escape sequences
const ENTER_ALT_SCREEN = '\x1b[?1049h\x1b[H';
const EXIT_ALT_SCREEN = '\x1b[?1049l';

/**
 * Get TTY identifier for Windows
 * Uses process ID based identifier since Windows doesn't have /dev/tty
 */
function getWindowsTtyId(): string {
  return generateWindowsTtyId();
}

/**
 * Run TUI with alternate screen buffer
 */
async function runWithAltScreen(renderFn: () => ReturnType<typeof render>) {
  process.stdout.write(ENTER_ALT_SCREEN);
  const { waitUntilExit } = renderFn();
  try {
    await waitUntilExit();
  } finally {
    process.stdout.write(EXIT_ALT_SCREEN);
  }
}

const program = new Command();

program
  .name('ccm')
  .description('Claude Code Monitor - CLI-based session monitoring (Windows)')
  .version(pkg.version);

program
  .command('watch')
  .alias('w')
  .description('Start the monitoring TUI')
  .action(async () => {
    await runWithAltScreen(() => render(<Dashboard />));
  });

program
  .command('hook <event>')
  .description('Handle a hook event from Claude Code (internal use)')
  .action(async (event: string) => {
    try {
      const tty = getWindowsTtyId();
      await handleHookEvent(event, tty);
    } catch (e) {
      console.error('Hook error:', e);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List all sessions')
  .action(() => {
    const sessions = getSessions();
    if (sessions.length === 0) {
      console.log('No active sessions');
      return;
    }
    const home = homedir();
    // Escape backslashes for Windows paths in regex
    const homeRegex = new RegExp(`^${home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    for (const session of sessions) {
      const cwd = session.cwd.replace(homeRegex, '~');
      const { symbol } = getStatusDisplay(session.status);
      console.log(`${symbol} ${cwd}`);
    }
  });

program
  .command('clear')
  .description('Clear all sessions')
  .action(() => {
    clearSessions();
    console.log('Sessions cleared');
  });

program
  .command('setup')
  .description('Setup Claude Code hooks for monitoring')
  .action(async () => {
    await setupHooks();
  });

program
  .command('notify')
  .description('Manage Windows notification settings')
  .option('--enable', 'Enable notifications')
  .option('--disable', 'Disable notifications')
  .option('--status', 'Show current notification settings')
  .action((options: { enable?: boolean; disable?: boolean; status?: boolean }) => {
    if (options.enable) {
      updateConfig({ notifications: { enabled: true, onPermissionPrompt: true, onSessionComplete: true } });
      console.log('Notifications enabled');
    } else if (options.disable) {
      updateConfig({ notifications: { enabled: false, onPermissionPrompt: true, onSessionComplete: true } });
      console.log('Notifications disabled');
    } else {
      // Default: show status
      const config = readConfig();
      console.log('Notification Settings:');
      console.log(`  Enabled: ${config.notifications.enabled ? 'Yes' : 'No'}`);
      console.log(`  On permission prompt: ${config.notifications.onPermissionPrompt ? 'Yes' : 'No'}`);
      console.log(`  On session complete: ${config.notifications.onSessionComplete ? 'Yes' : 'No'}`);
      console.log(`\nConfig file: ${getConfigPath()}`);
    }
  });

/**
 * Default action (when launched without arguments)
 * - Run setup if not configured
 * - Launch monitor if already configured
 */
async function defaultAction() {
  if (!isHooksConfigured()) {
    console.log('Initial setup required.\n');
    await setupHooks();

    // Verify setup was completed
    if (!isHooksConfigured()) {
      // Setup was cancelled
      return;
    }
    console.log('');
  }

  // Launch monitor
  await runWithAltScreen(() => render(<Dashboard />));
}

// Default action when executed without commands
if (process.argv.length === 2) {
  defaultAction().catch(console.error);
} else {
  program.parse();
}
