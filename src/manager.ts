import EventEmitter, { once } from 'events';
import * as Net from 'net';
import { parseLines, buildActionMessage } from './protocol';
import { stringHasLength } from './utils';
import type { AMIAction, AMIEvent, ManagerContext, ManagerOptions } from './types';
import type { ManagerEventMap } from './events';

export class Manager extends EventEmitter<ManagerEventMap> {
  readonly options: Required<ManagerOptions>;
  private context: ManagerContext;
  private reconnectListener?: () => void;

  constructor(options: ManagerOptions) {
    super();
    this.options = {
      port: options.port,
      host: options.host ?? 'localhost',
      username: options.username ?? '',
      password: options.password ?? '',
      events: options.events ?? false,
    };
    this.context = {
      authenticated: false,
      backoff: 10000,
      lines: [],
      leftOver: '',
    };

    this.on('rawevent', (event: AMIEvent) => this.handleRawEvent(event));
    this.on('error', () => {});
    this.on('connect', () => { this.context.backoff = 10000; });
  }

  connect = (port = this.options.port, host = this.options.host): Promise<void> => {
    const ctx = this.context;

    if (ctx.connection && ctx.connection.readyState !== 'closed') {
      return Promise.resolve();
    }

    ctx.authenticated = false;

    return new Promise((resolve, reject) => {
      const socket = Net.createConnection(port, host);
      socket.setKeepAlive(true);
      socket.setNoDelay(true);
      socket.setEncoding('utf-8');

      const onConnect = () => {
        socket.removeListener('error', onInitialError);
        resolve();
      };
      const onInitialError = (err: Error) => {
        socket.removeListener('connect', onConnect);
        reject(err);
      };

      socket.once('connect', onConnect);
      socket.once('error', onInitialError);

      socket.on('connect', () => this.emit('connect'));
      socket.on('close', () => this.emit('close'));
      socket.on('end', () => this.emit('end'));
      socket.on('data', (data) => this.handleData(String(data)));
      socket.on('error', (err) => this.emit('error', err));

      ctx.connection = socket;
    });
  };

  login = async (
    username = this.options.username,
    password = this.options.password,
    events = this.options.events,
  ): Promise<void> => {
    const response = await this.action({
      action: 'login',
      username,
      secret: password,
      events: events ? 'on' : 'off',
    });

    if (response.response?.toLowerCase() === 'error') {
      throw new Error(`Login failed: ${response.message ?? 'unknown error'}`);
    }

    this.context.authenticated = true;
    this.emit('authenticated');
  };

  keepConnected = (): this => {
    if (this.reconnectListener) return this;
    this.reconnectListener = () => this.scheduleReconnect();
    this.on('close', this.reconnectListener);
    return this;
  };

  disconnect = (): void => {
    if (this.reconnectListener) {
      this.removeListener('close', this.reconnectListener);
      this.reconnectListener = undefined;
    }
    const conn = this.context.connection;
    if (conn?.readyState === 'open') conn.end();
    delete this.context.connection;
  };

  isConnected = (): boolean => {
    return (this.context.connection?.readyState ?? 'closed') === 'open';
  };

  action = async <T extends AMIEvent = AMIEvent>(action: AMIAction): Promise<T> => {
    const ctx = this.context;
    const req = { ...action };

    let id = req.actionid ?? String(Date.now());
    delete req.actionid;

    while (this.listenerCount(id) > 0) {
      id += String(Math.floor(Math.random() * 9));
    }

    if (!ctx.authenticated && req.action !== 'login') {
      await this.awaitAuthenticated();
    }

    if (!ctx.connection) {
      throw new Error('Not connected');
    }

    ctx.connection.write(buildActionMessage(req, id), 'utf-8');
    ctx.lastid = id;

    const [err, event] = await once(this, id) as [AMIEvent | undefined, T];
    if (err) throw new Error(String(err.message ?? 'Action failed'));
    return event;
  };

  private awaitAuthenticated = (): Promise<void> => {
    if (this.context.authenticated) return Promise.resolve();
    return once(this, 'authenticated').then(() => undefined);
  };

  private scheduleReconnect = (): void => {
    const ctx = this.context;
    console.log(`Trying to reconnect to AMI in ${ctx.backoff / 1000} seconds`);
    setTimeout(async () => {
      try {
        await this.connect(this.options.port, this.options.host);
        await this.login();
      } catch {
        // next 'close' event will trigger another attempt
      }
    }, ctx.backoff);
    if (ctx.backoff < 60000) ctx.backoff += 10000;
  };

  private handleData = (data: string): void => {
    const ctx = this.context;
    ctx.leftOver += data;
    const incoming = ctx.leftOver.split(/\r?\n/);
    ctx.leftOver = incoming.pop() ?? '';
    ctx.lines = ctx.lines.concat(incoming);

    let lines: string[] = [];
    let follow = 0;

    while (ctx.lines.length) {
      const line = ctx.lines.shift()!;

      if (!lines.length && line.startsWith('Asterisk Call Manager')) {
        // ignore greeting
      } else if (
        !lines.length &&
        line.slice(0, 9).toLowerCase() === 'response:' &&
        line.toLowerCase().includes('follow')
      ) {
        follow = 1;
        lines.push(line);
      } else if (follow === 1 && (line === '--END COMMAND--' || line === '--END SMS EVENT--')) {
        follow = 2;
        lines.push(line);
      } else if (follow === 2 && !line.length) {
        follow = 0;
        lines.pop();
        const item: AMIEvent = { response: 'follows', content: lines.join('\n') };
        const match = item.content?.match(/actionid: ([^\r\n]+)/i);
        if (match) item.actionid = match[1];
        lines = [];
        this.emit('rawevent', item);
      } else if (!follow && !line.length) {
        const item = parseLines(lines.filter(stringHasLength));
        lines = [];
        this.emit('rawevent', item);
      } else {
        lines.push(line);
      }
    }

    ctx.lines = lines;
  };

  private handleRawEvent = (event: AMIEvent): void => {
    const emits: Array<() => void> = [];

    if (event.response && event.actionid && typeof event.response === 'string') {
      const isError = event.response.toLowerCase() === 'error';
      emits.push(() => this.emit(event.actionid!, isError ? event : undefined, event));
      emits.push(() => this.emit('response', event));
    } else if (event.response && event.content) {
      emits.push(() => this.emit(this.context.lastid!, undefined, event));
      emits.push(() => this.emit('response', event));
    }

    if (event.event) {
      const eventName = String(
        Array.isArray(event.event) ? event.event[0] : event.event,
      ).toLowerCase();
      event.event = eventName;
      emits.push(() => this.emit('managerevent', event));
      emits.push(() => this.emit(eventName, event));
      if (eventName === 'userevent' && event.userevent) {
        emits.push(() => this.emit(`userevent-${String(event.userevent).toLowerCase()}`, event));
      }
    } else {
      emits.push(() => this.emit('asterisk', event));
    }

    emits.forEach((fn) => process.nextTick(fn));
  };
}
