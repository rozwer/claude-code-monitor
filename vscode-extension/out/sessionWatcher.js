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
exports.SessionWatcher = void 0;
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const chokidar_1 = require("chokidar");
/**
 * Watches the session store file for changes
 */
class SessionWatcher {
    watcher = null;
    storePath;
    previousSessions = new Map();
    onSessionsChange;
    onPermissionRequired;
    constructor(onSessionsChange, onPermissionRequired) {
        this.storePath = path.join(os.homedir(), '.claude-monitor', 'sessions.json');
        this.onSessionsChange = onSessionsChange;
        this.onPermissionRequired = onPermissionRequired;
    }
    start() {
        // Ensure directory exists
        const dir = path.dirname(this.storePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // Initialize with current state
        this.loadSessions();
        // Watch for changes
        this.watcher = (0, chokidar_1.watch)(this.storePath, {
            persistent: true,
            ignoreInitial: true,
        });
        this.watcher.on('change', () => {
            this.loadSessions();
        });
        this.watcher.on('add', () => {
            this.loadSessions();
        });
    }
    stop() {
        this.watcher?.close();
        this.watcher = null;
    }
    loadSessions() {
        try {
            if (!fs.existsSync(this.storePath)) {
                this.onSessionsChange([]);
                return;
            }
            const content = fs.readFileSync(this.storePath, 'utf-8');
            const data = JSON.parse(content);
            const sessions = Object.values(data.sessions);
            // Detect permission prompts
            for (const session of sessions) {
                const prev = this.previousSessions.get(session.session_id);
                // Trigger notification if status changed to waiting_input
                if (session.status === 'waiting_input' && prev?.status !== 'waiting_input') {
                    this.onPermissionRequired(session);
                }
            }
            // Update previous state
            this.previousSessions.clear();
            for (const session of sessions) {
                this.previousSessions.set(session.session_id, { ...session });
            }
            this.onSessionsChange(sessions);
        }
        catch {
            // Ignore parse errors
        }
    }
    clearSessions() {
        try {
            const emptyData = {
                sessions: {},
                last_updated: Date.now(),
            };
            fs.writeFileSync(this.storePath, JSON.stringify(emptyData, null, 2));
            this.previousSessions.clear();
        }
        catch {
            // Ignore write errors
        }
    }
}
exports.SessionWatcher = SessionWatcher;
//# sourceMappingURL=sessionWatcher.js.map