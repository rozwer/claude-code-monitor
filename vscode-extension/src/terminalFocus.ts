import * as vscode from 'vscode';

/**
 * Terminal Focus Manager for VSCode
 * Uses VSCode API to focus specific terminals by session ID
 */
export class TerminalFocusManager {
  private terminalMap: Map<string, vscode.Terminal> = new Map();

  constructor() {
    // Track terminal creation/disposal
    vscode.window.onDidOpenTerminal((terminal) => {
      this.registerTerminal(terminal);
    });

    vscode.window.onDidCloseTerminal((terminal) => {
      this.unregisterTerminal(terminal);
    });

    // Register existing terminals
    for (const terminal of vscode.window.terminals) {
      this.registerTerminal(terminal);
    }
  }

  /**
   * Register a terminal, extracting session ID if it's a Claude Code terminal
   */
  private registerTerminal(terminal: vscode.Terminal): void {
    // Claude Code terminals are created with specific names or can be identified
    // by environment variables or creation options
    const name = terminal.name;

    // Try to extract session ID from terminal name or environment
    // Claude Code typically names terminals like "Claude Code" or includes session info
    if (name.includes('Claude') || name.includes('claude')) {
      // For now, use terminal name as identifier
      // In practice, we'd need to correlate with session file data
      this.terminalMap.set(name, terminal);
    }
  }

  private unregisterTerminal(terminal: vscode.Terminal): void {
    for (const [key, t] of this.terminalMap.entries()) {
      if (t === terminal) {
        this.terminalMap.delete(key);
        break;
      }
    }
  }

  /**
   * Focus a terminal by session ID
   */
  focusSessionTerminal(sessionId: string): boolean {
    // Strategy 1: Find terminal by session ID in name
    for (const terminal of vscode.window.terminals) {
      if (terminal.name.includes(sessionId)) {
        terminal.show();
        return true;
      }
    }

    // Strategy 2: Find any Claude Code terminal
    for (const terminal of vscode.window.terminals) {
      if (terminal.name.includes('Claude') || terminal.name.includes('claude')) {
        terminal.show();
        return true;
      }
    }

    // Strategy 3: Focus the integrated terminal panel
    vscode.commands.executeCommand('workbench.action.terminal.focus');
    return true;
  }

  /**
   * Focus terminal panel (general)
   */
  focusTerminalPanel(): void {
    vscode.commands.executeCommand('workbench.action.terminal.focus');
  }

  /**
   * Get list of active Claude-related terminals
   */
  getClaudeTerminals(): vscode.Terminal[] {
    return vscode.window.terminals.filter(
      t => t.name.includes('Claude') || t.name.includes('claude')
    );
  }
}
