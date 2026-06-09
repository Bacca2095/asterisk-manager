import type * as Net from 'net';

// Public

interface ManagerOptions {
  port: number;
  host?: string;
  username?: string;
  password?: string;
  events?: boolean;
}

type AMIValue = string | string[] | Record<string, string>;

interface AMIAction {
  action: string;
  actionid?: string;
  [key: string]: AMIValue | undefined;
}

interface AMIEvent {
  event?: string | string[];
  response?: string;
  actionid?: string;
  content?: string;
  userevent?: string;
  message?: string;
  [key: string]: AMIValue | undefined;
}

// Internal

interface ManagerContext {
  connection?: Net.Socket;
  authenticated: boolean;
  backoff: number;
  lastid?: string;
  lines: string[];
  leftOver: string;
}

export type { ManagerOptions, AMIValue, AMIAction, AMIEvent, ManagerContext };
