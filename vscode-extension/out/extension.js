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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sessionTreeProvider_1 = require("./sessionTreeProvider");
const sessionWatcher_1 = require("./sessionWatcher");
const terminalFocus_1 = require("./terminalFocus");
let sessionWatcher;
function activate(context) {
    const terminalFocus = new terminalFocus_1.TerminalFocusManager();
    const treeProvider = new sessionTreeProvider_1.SessionTreeProvider();
    // Register tree view
    const treeView = vscode.window.createTreeView('claude-code-monitor.sessions', {
        treeDataProvider: treeProvider,
    });
    // Start watching sessions
    sessionWatcher = new sessionWatcher_1.SessionWatcher((sessions) => {
        treeProvider.refresh(sessions);
    }, (session) => {
        // Handle permission prompt
        const config = vscode.workspace.getConfiguration('claudeCodeMonitor');
        if (config.get('showNotifications')) {
            vscode.window.showInformationMessage(`Claude Code session needs permission: ${session.cwd}`, 'Focus Terminal').then((action) => {
                if (action === 'Focus Terminal') {
                    terminalFocus.focusSessionTerminal(session.session_id);
                }
            });
        }
        if (config.get('autoFocusOnPermission')) {
            terminalFocus.focusSessionTerminal(session.session_id);
        }
    });
    sessionWatcher.start();
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('claude-code-monitor.showDashboard', () => {
        const first = treeProvider.getFirstSession();
        if (first) {
            treeView.reveal(first, { focus: true });
        }
    }), vscode.commands.registerCommand('claude-code-monitor.focusSession', async () => {
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
    }), vscode.commands.registerCommand('claude-code-monitor.clearSessions', () => {
        sessionWatcher?.clearSessions();
        treeProvider.refresh([]);
        vscode.window.showInformationMessage('Cleared all Claude Code sessions');
    }), treeView);
}
function deactivate() {
    sessionWatcher?.stop();
}
//# sourceMappingURL=extension.js.map