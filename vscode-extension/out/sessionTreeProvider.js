"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Tree data provider for displaying Claude Code sessions in the sidebar
 */
class SessionTreeProvider {
    sessions = [];
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh(sessions) {
        this.sessions = sessions;
        this._onDidChangeTreeData.fire(undefined);
    }
    getSessions() {
        return this.sessions;
    }
    getFirstSession() {
        if (this.sessions.length === 0)
            return undefined;
        return new SessionItem(this.sessions[0]);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return this.sessions.map(s => new SessionItem(s));
    }
}
exports.SessionTreeProvider = SessionTreeProvider;
class SessionItem extends vscode.TreeItem {
    session;
    constructor(session) {
        super(session.cwd || session.session_id, vscode.TreeItemCollapsibleState.None);
        this.session = session;
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
    buildTooltip() {
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
    getIcon() {
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
//# sourceMappingURL=sessionTreeProvider.js.map