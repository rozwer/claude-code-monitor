import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';

export interface Session {
  session_id: string;
  status: 'running' | 'waiting_input' | 'stopped';
  cwd?: string;
  tty?: string;
  last_updated: number;
  tool_name?: string;
}

interface StoreData {
  sessions: Record<string, Session>;
  last_updated: number;
}

type SessionsCallback = (sessions: Session[]) => void;
type PermissionCallback = (session: Session) => void;

/**
 * Watches the session store file for changes
 */
export class SessionWatcher {
  private watcher: FSWatcher | null = null;
  private storePath: string;
  private previousSessions: Map<string, Session> = new Map();
  private onSessionsChange: SessionsCallback;
  private onPermissionRequired: PermissionCallback;

  constructor(
    onSessionsChange: SessionsCallback,
    onPermissionRequired: PermissionCallback
  ) {
    this.storePath = path.join(os.homedir(), '.claude-monitor', 'sessions.json');
    this.onSessionsChange = onSessionsChange;
    this.onPermissionRequired = onPermissionRequired;
  }

  start(): void {
    // Ensure directory exists
    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize with current state
    this.loadSessions();

    // Watch for changes
    this.watcher = watch(this.storePath, {
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

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
  }

  private loadSessions(): void {
    try {
      if (!fs.existsSync(this.storePath)) {
        this.onSessionsChange([]);
        return;
      }

      const content = fs.readFileSync(this.storePath, 'utf-8');
      const data: StoreData = JSON.parse(content);
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
    } catch {
      // Ignore parse errors
    }
  }

  clearSessions(): void {
    try {
      const emptyData: StoreData = {
        sessions: {},
        last_updated: Date.now(),
      };
      fs.writeFileSync(this.storePath, JSON.stringify(emptyData, null, 2));
      this.previousSessions.clear();
    } catch {
      // Ignore write errors
    }
  }
}
