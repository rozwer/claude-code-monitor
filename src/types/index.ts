// Hook event types
export type HookEventName =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'UserPromptSubmit';

// Event received from hooks (for internal processing)
export interface HookEvent {
  session_id: string;
  cwd: string;
  tty?: string;
  hook_event_name: HookEventName;
  notification_type?: string;
}

// Session status
export type SessionStatus = 'running' | 'waiting_input' | 'stopped';

// Session information (minimal)
export interface Session {
  session_id: string;
  cwd: string;
  tty?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

// File store data structure
export interface StoreData {
  sessions: Record<string, Session>;
  updated_at: string;
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  onPermissionPrompt: boolean;
  onSessionComplete: boolean;
}

// Configuration
export interface Config {
  notifications: NotificationSettings;
}

// Default configuration
export const DEFAULT_CONFIG: Config = {
  notifications: {
    enabled: false,
    onPermissionPrompt: true,
    onSessionComplete: true,
  },
};
