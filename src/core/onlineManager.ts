import { Peer, type DataConnection } from 'peerjs';

export interface OnlineMove {
  type: 'move';
  row: number;
  col: number;
}

export interface OnlineSkill {
  type: 'skill';
}

export interface OnlineInit {
  type: 'init';
  leaderId: string;
  uncapLevel: number;
  name: string;
}

export type OnlineMessage = OnlineMove | OnlineSkill | OnlineInit;

export class OnlineManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessageCallback: ((msg: OnlineMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  constructor() {}

  init(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = peerId ? new Peer(peerId) : new Peer();
      
      this.peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        resolve(id);
      });

      this.peer.on('connection', (connection) => {
        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  connect(targetId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) return reject('Peer not initialized');
      
      this.conn = this.peer.connect(targetId);
      
      this.conn.on('open', () => {
        this.setupConnection();
        resolve();
      });

      this.conn.on('error', (err) => {
        console.error('Connection error:', err);
        reject(err);
      });
    });
  }

  private setupConnection(): void {
    if (!this.conn) return;

    this.conn.on('data', (data) => {
      const msg = data as OnlineMessage;
      if (this.onMessageCallback) this.onMessageCallback(msg);
    });

    this.conn.on('close', () => {
      if (this.onDisconnectCallback) this.onDisconnectCallback();
    });

    if (this.onConnectCallback) this.onConnectCallback();
  }

  send(msg: OnlineMessage): void {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  }

  onMessage(cb: (msg: OnlineMessage) => void): void {
    this.onMessageCallback = cb;
  }

  onConnect(cb: () => void): void {
    this.onConnectCallback = cb;
  }

  onDisconnect(cb: () => void): void {
    this.onDisconnectCallback = cb;
  }

  disconnect(): void {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  getPeerId(): string | null {
    return this.peer ? this.peer.id : null;
  }

  isConnected(): boolean {
    return this.conn !== null && this.conn.open;
  }
}

export const onlineManager = new OnlineManager();
