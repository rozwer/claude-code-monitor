import * as vscode from 'vscode';
import { SessionTreeProvider } from './sessionTreeProvider';
import { SessionWatcher } from './sessionWatcher';
import { TerminalFocusManager } from './terminalFocus';

let sessionWatcher: SessionWatcher | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const terminalFocus = new TerminalFocusManager();
  const treeProvider = new SessionTreeProvider();

  // Register tree view
  const treeView = vscode.window.createTreeView('claude-code-monitor.sessions', {
    treeDataProvider: treeProvider,
  });

  // Start watching sessions
  sessionWatcher = new SessionWatcher(
    (sessions) => {
      treeProvider.refresh(sessions);
    },
    (session) => {
      // Handle permission prompt
      const config = vscode.workspace.getConfiguration('claudeCodeMonitor');

      if (config.get('showNotifications')) {
        vscode.window.showInformationMessage(
          `Claude Code session needs permission: ${session.cwd}`,
          'Focus Terminal'
        ).then((action) => {
          if (action === 'Focus Terminal') {
            terminalFocus.focusSessionTerminal(session.session_id);
          }
        });
      }

      if (config.get('autoFocusOnPermission')) {
        terminalFocus.focusSessionTerminal(session.session_id);
      }
    }
  );
  sessionWatcher.start();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('claude-code-monitor.showDashboard', () => {
      const first = treeProvider.getFirstSession();
      if (first) {
        treeView.reveal(first, { focus: true });
      }
    }),

    vscode.commands.registerCommand('claude-code-monitor.focusSession', async () => {
      const sessions = treeProvider.getSessions();
      if (sessions.length === 0) {
        vscode.window.showInformationMessage('No active Claude Code sessions');
        return;
      }

      const items = sessions.map(s => ({
        label: s.cwd || 'Unknown',
        description: s.status,
        session: s,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a session to focus',
      });

      if (selected) {
        terminalFocus.focusSessionTerminal(selected.session.session_id);
      }
    }),

    vscode.commands.registerCommand('claude-code-monitor.clearSessions', () => {
      sessionWatcher?.clearSessions();
      treeProvider.refresh([]);
      vscode.window.showInformationMessage('Cleared all Claude Code sessions');
    }),

    treeView
  );
}

export function deactivate(): void {
  sessionWatcher?.stop();
}
