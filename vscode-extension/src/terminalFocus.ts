import * as vscode from 'vscode';

/**
 * Terminal Focus Manager for VSCode
 * Uses VSCode API to focus specific terminals
 */
export class TerminalFocusManager {
  /**
   * Focus terminal - simply focus the terminal panel
   * VSCode doesn't provide a way to identify which terminal runs which process,
   * so we focus the panel and let user select if needed
   */
  focusSessionTerminal(_sessionId: string): boolean {
    // Focus the integrated terminal panel
    vscode.commands.executeCommand('workbench.action.terminal.focus');
    return true;
  }

  /**
   * Focus terminal panel (general)
   */
  focusTerminalPanel(): void {
    vscode.commands.executeCommand('workbench.action.terminal.focus');
  }
}
