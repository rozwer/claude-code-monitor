import * as vscode from 'vscode';
import type { Session } from './sessionWatcher';

/**
 * Tree data provider for displaying Claude Code sessions in the sidebar
 */
export class SessionTreeProvider implements vscode.TreeDataProvider<SessionItem> {
  private sessions: Session[] = [];
  private _onDidChangeTreeData = new vscode.EventEmitter<SessionItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(sessions: Session[]): void {
    this.sessions = sessions;
    this._onDidChangeTreeData.fire(undefined);
  }

  getSessions(): Session[] {
    return this.sessions;
  }

  getFirstSession(): SessionItem | undefined {
    if (this.sessions.length === 0) return undefined;
    return new SessionItem(this.sessions[0]);
  }

  getTreeItem(element: SessionItem): vscode.TreeItem {
    return element;
  }

  getChildren(): SessionItem[] {
    return this.sessions.map(s => new SessionItem(s));
  }
}

class SessionItem extends vscode.TreeItem {
  constructor(public readonly session: Session) {
    super(session.cwd || session.session_id, vscode.TreeItemCollapsibleState.None);

    this.description = session.status;
    this.tooltip = this.buildTooltip();
    this.iconPath = this.getIcon();
    this.contextValue = 'session';

    // Make item clickable to focus terminal
    this.command = {
      command: 'claude-code-monitor.focusSession',
      title: 'Focus Session',
    };
  }

  private buildTooltip(): string {
    const lines = [
      `Session: ${this.session.session_id}`,
      `Status: ${this.session.status}`,
      `CWD: ${this.session.cwd || 'Unknown'}`,
    ];

    if (this.session.tool_name) {
      lines.push(`Tool: ${this.session.tool_name}`);
    }

    if (this.session.tty) {
      lines.push(`TTY: ${this.session.tty}`);
    }

    const updated = new Date(this.session.last_updated);
    lines.push(`Updated: ${updated.toLocaleTimeString()}`);

    return lines.join('\n');
  }

  private getIcon(): vscode.ThemeIcon {
    switch (this.session.status) {
      case 'running':
        return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.green'));
      case 'waiting_input':
        return new vscode.ThemeIcon('bell', new vscode.ThemeColor('charts.yellow'));
      case 'stopped':
        return new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('charts.gray'));
      default:
        return new vscode.ThemeIcon('terminal');
    }
  }
}
