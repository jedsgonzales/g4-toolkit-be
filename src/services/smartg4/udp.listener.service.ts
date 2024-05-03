import * as dgram from 'node:dgram';

export class UdpListener {
  socket: dgram.Socket;
  isClosed = false;
  aborter: AbortController;

  constructor(
    private port: number,
    private onMessage: (msg: Buffer) => Promise<void>,
  ) {}

  public listen() {
    this.aborter = new AbortController();
    this.socket = dgram.createSocket({
      type: 'udp4',
      signal: this.aborter.signal,
    });

    this.socket.on('message', this.onMessage);
    this.socket.on('connect', () => {
      console.log('UDP socket connected');
    });
    this.socket.on('listening', () => {
      const srv = this.socket.address();
      console.log('listening on port', srv.address, srv.port);
    });

    this.socket.on('error', (err) => {
      console.log('UDP socket error:', err);
      this.socket.close();

      if (!this.isClosed) {
        this.listen();
      }
    });

    this.socket.bind(this.port, () => {
      this.socket.setBroadcast(true);
    });
  }

  close() {
    this.isClosed = true;
    this.aborter.abort();
    this.socket.close();
  }
}
