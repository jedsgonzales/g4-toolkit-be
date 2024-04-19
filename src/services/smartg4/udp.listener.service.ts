import { Injectable } from '@nestjs/common';
import dgram from 'dgram';

@Injectable()
export class UdpListener {
  socket: dgram.Socket;
  isClosed = false;

  constructor(
    private port: number,
    private onMessage: (msg: Buffer) => void,
  ) {
    this.createSocket();
  }

  private createSocket() {
    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', this.onMessage);

    this.socket.on('error', (err) => {
      console.log('UDP socket error:', err);
      this.socket.close();

      if (!this.isClosed) {
        this.createSocket();
      }
    });

    this.socket.bind(this.port);
  }

  close() {
    this.isClosed = true;
    this.socket.close();
  }
}
