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
exports.TerminalFocusManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Terminal Focus Manager for VSCode
 * Uses VSCode API to focus specific terminals by session ID
 */
class TerminalFocusManager {
    terminalMap = new Map();
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
    registerTerminal(terminal) {
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
    unregisterTerminal(terminal) {
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
    focusSessionTerminal(sessionId) {
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
    focusTerminalPanel() {
        vscode.commands.executeCommand('workbench.action.terminal.focus');
    }
    /**
     * Get list of active Claude-related terminals
     */
    getClaudeTerminals() {
        return vscode.window.terminals.filter(t => t.name.includes('Claude') || t.name.includes('claude'));
    }
}
exports.TerminalFocusManager = TerminalFocusManager;
//# sourceMappingURL=terminalFocus.js.map