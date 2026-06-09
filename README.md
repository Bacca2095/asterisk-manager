# asterisk-manager

TypeScript client for the [Asterisk Manager Interface (AMI)](https://wiki.asterisk.org/wiki/display/AST/The+Asterisk+Manager+TCP+IP+API).

## Install

```sh
pnpm add asterisk-manager
```

## Usage

```ts
import { Manager } from 'asterisk-manager';

const manager = new Manager({
  port: 5038,
  host: 'localhost',
  username: 'admin',
  password: 'secret',
  events: true,
});

await manager.connect();
await manager.login();

// Reconnect automatically on disconnect
manager.keepConnected();

// Listen for any AMI event
manager.on('managerevent', (event) => console.log(event));

// Listen for a specific AMI event
// Full list: https://wiki.asterisk.org/wiki/display/AST/Asterisk+AMI+Events
manager.on('hangup', (event) => console.log('Hangup:', event));

// Send an AMI action and await the response
// Full list: https://wiki.asterisk.org/wiki/display/AST/AMI+Actions
const res = await manager.action({
  action: 'Originate',
  channel: 'SIP/myphone',
  context: 'default',
  exten: '1234',
  priority: '1',
  variable: {
    name1: 'value1',
    name2: 'value2',
  },
});

manager.disconnect();
```

## API

### `new Manager(options)`

| Option     | Type      | Default       | Description                              |
|------------|-----------|---------------|------------------------------------------|
| `port`     | `number`  | —             | AMI port (required)                      |
| `host`     | `string`  | `'localhost'` | AMI host                                 |
| `username` | `string`  | `''`          | AMI username                             |
| `password` | `string`  | `''`          | AMI password                             |
| `events`   | `boolean` | `false`       | Whether to receive AMI events after login |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect(port?, host?)` | `Promise<void>` | Open the TCP connection |
| `login(username?, password?, events?)` | `Promise<void>` | Authenticate with AMI |
| `action(action)` | `Promise<AMIEvent>` | Send an AMI action and await its response |
| `keepConnected()` | `this` | Reconnect automatically with exponential backoff (max 60s) |
| `disconnect()` | `void` | Close the connection and stop reconnecting |
| `isConnected()` | `boolean` | Whether the socket is currently open |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | — | Socket connected |
| `close` | — | Socket closed |
| `end` | — | Socket ended |
| `error` | `Error` | Socket error |
| `managerevent` | `AMIEvent` | Any AMI event received |
| `response` | `AMIEvent` | Any AMI action response |
| `<eventname>` | `AMIEvent` | Specific AMI event by name (e.g. `hangup`) |
| `userevent-<name>` | `AMIEvent` | UserEvent with a specific name |

## License

MIT — Cesar Bacca
