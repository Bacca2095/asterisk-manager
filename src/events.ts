import type { AMIEvent } from './types';

// Shared field groups

interface ChannelFields {
  channel: string;
  channelstate?: string;
  channelstatedesc?: string;
  calleridnum?: string;
  calleridname?: string;
  connectedlinenum?: string;
  connectedlinename?: string;
  language?: string;
  accountcode?: string;
  context?: string;
  exten?: string;
  priority?: string;
  uniqueid?: string;
  linkedid?: string;
}

interface BridgeFields {
  bridgeuniqueid?: string;
  bridgetype?: string;
  bridgetechnology?: string;
  bridgecreator?: string;
  bridgename?: string;
  bridgenumchannels?: string;
}

// Channel lifecycle

export interface NewchannelEvent extends ChannelFields {
  event: 'Newchannel';
}

export interface NewstateEvent extends ChannelFields {
  event: 'Newstate';
}

export interface HangupEvent extends ChannelFields {
  event: 'Hangup';
  cause?: string;
  causetxt?: string;
}

export interface SofthangupEvent extends ChannelFields {
  event: 'Softhanugp';
  cause?: string;
}

// Calling

export interface DialEvent extends ChannelFields {
  event: 'Dial';
  subevent?: 'Begin' | 'End';
  destination?: string;
  destuniqueid?: string;
  destcalleridnum?: string;
  destcalleridname?: string;
  dialstring?: string;
  dialstatus?: string;
}

export interface OriginateResponseEvent extends ChannelFields {
  event: 'OriginateResponse';
  response?: string;
  reason?: string;
}

// Bridge

export interface BridgeCreateEvent extends BridgeFields {
  event: 'BridgeCreate';
}

export interface BridgeDestroyEvent extends BridgeFields {
  event: 'BridgeDestroy';
}

export interface BridgeEnterEvent extends ChannelFields, BridgeFields {
  event: 'BridgeEnter';
}

export interface BridgeLeaveEvent extends ChannelFields, BridgeFields {
  event: 'BridgeLeave';
}

// Conference

export interface ConfBridgeStartEvent {
  event: 'ConfBridgeStart';
  conference?: string;
  bridgeuniqueid?: string;
}

export interface ConfBridgeEndEvent {
  event: 'ConfBridgeEnd';
  conference?: string;
  bridgeuniqueid?: string;
}

export interface ConfBridgeJoinEvent extends ChannelFields {
  event: 'ConfBridgeJoin';
  conference?: string;
  bridgeuniqueid?: string;
}

export interface ConfBridgeLeaveEvent extends ChannelFields {
  event: 'ConfBridgeLeave';
  conference?: string;
  bridgeuniqueid?: string;
}

// Queue

export interface QueueCallerJoinEvent extends ChannelFields {
  event: 'QueueCallerJoin';
  queue?: string;
  position?: string;
  count?: string;
}

export interface QueueCallerLeaveEvent extends ChannelFields {
  event: 'QueueCallerLeave';
  queue?: string;
  position?: string;
  count?: string;
}

export interface QueueMemberStatusEvent {
  event: 'QueueMemberStatus';
  queue?: string;
  membername?: string;
  interface?: string;
  stateinterface?: string;
  membership?: string;
  penalty?: string;
  callstaken?: string;
  lastcall?: string;
  status?: string;
  paused?: string;
  inuse?: string;
}

export interface QueueMemberAddedEvent {
  event: 'QueueMemberAdded';
  queue?: string;
  membername?: string;
  interface?: string;
}

export interface QueueMemberRemovedEvent {
  event: 'QueueMemberRemoved';
  queue?: string;
  membername?: string;
  interface?: string;
}

export interface AgentConnectEvent extends ChannelFields {
  event: 'AgentConnect';
  queue?: string;
  membername?: string;
  holdtime?: string;
}

export interface AgentCompleteEvent extends ChannelFields {
  event: 'AgentComplete';
  queue?: string;
  membername?: string;
  talktime?: string;
  holdtime?: string;
  reason?: string;
}

// DTMF

export interface DtmfBeginEvent extends ChannelFields {
  event: 'DTMFBegin';
  digit?: string;
  direction?: string;
}

export interface DtmfEndEvent extends ChannelFields {
  event: 'DTMFEnd';
  digit?: string;
  durationms?: string;
  direction?: string;
}

// Hold

export interface HoldEvent extends ChannelFields {
  event: 'Hold';
  musicclass?: string;
}

export interface UnholdEvent extends ChannelFields {
  event: 'Unhold';
}

// Other

export interface VarSetEvent extends ChannelFields {
  event: 'VarSet';
  variable?: string;
  value?: string;
}

export interface ExtensionStatusEvent {
  event: 'ExtensionStatus';
  exten?: string;
  context?: string;
  hint?: string;
  status?: string;
  statustext?: string;
}

export interface CdrEvent {
  event: 'Cdr';
  accountcode?: string;
  source?: string;
  destination?: string;
  destinationcontext?: string;
  callerid?: string;
  channel?: string;
  destinationchannel?: string;
  lastapplication?: string;
  lastdata?: string;
  starttime?: string;
  answertime?: string;
  endtime?: string;
  duration?: string;
  billableseconds?: string;
  disposition?: string;
  amaflags?: string;
  uniqueid?: string;
  userfield?: string;
}

export interface UserEvent extends ChannelFields {
  event: 'UserEvent';
  userevent?: string;
  [key: string]: string | undefined;
}

// EventEmitter map

export interface ManagerEventMap {
  // Connection
  connect: [];
  close: [];
  end: [];
  error: [error: Error];
  authenticated: [];

  // AMI protocol
  rawevent: [event: AMIEvent];
  response: [event: AMIEvent];
  managerevent: [event: AMIEvent];
  asterisk: [event: AMIEvent];

  // Channel lifecycle
  newchannel: [event: NewchannelEvent];
  newstate: [event: NewstateEvent];
  hangup: [event: HangupEvent];
  softhanugp: [event: SofthangupEvent];

  // Calling
  dial: [event: DialEvent];
  originateresponse: [event: OriginateResponseEvent];

  // Bridge
  bridgecreate: [event: BridgeCreateEvent];
  bridgedestroy: [event: BridgeDestroyEvent];
  bridgeenter: [event: BridgeEnterEvent];
  bridgeleave: [event: BridgeLeaveEvent];

  // Conference
  confbridgestart: [event: ConfBridgeStartEvent];
  confbridgeend: [event: ConfBridgeEndEvent];
  confbridgejoin: [event: ConfBridgeJoinEvent];
  confbridgeleave: [event: ConfBridgeLeaveEvent];

  // Queue
  queuecallerjoin: [event: QueueCallerJoinEvent];
  queuecallerleave: [event: QueueCallerLeaveEvent];
  queuememberstatus: [event: QueueMemberStatusEvent];
  queuememberadded: [event: QueueMemberAddedEvent];
  queuememberremoved: [event: QueueMemberRemovedEvent];
  agentconnect: [event: AgentConnectEvent];
  agentcomplete: [event: AgentCompleteEvent];

  // DTMF
  dtmfbegin: [event: DtmfBeginEvent];
  dtmfend: [event: DtmfEndEvent];

  // Hold
  hold: [event: HoldEvent];
  unhold: [event: UnholdEvent];

  // Other
  varset: [event: VarSetEvent];
  extensionstatus: [event: ExtensionStatusEvent];
  cdr: [event: CdrEvent];
  userevent: [event: UserEvent];

  // Catch-all for unlisted events
  [key: string]: any[];
}
