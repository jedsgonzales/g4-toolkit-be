import { Injectable } from '@nestjs/common';
import dgram from 'dgram';

@Injectable()
export class UdpSender {
  socket: dgram.Socket;
  isClosed = false;

  constructor(
    private destPort: number,
    private destIp: string,
  ) {}

  sendSocketMsg(msg: Buffer, onFailure?: (err: Error, bytes: number) => void) {
    this.socket = dgram.createSocket('udp4');

    this.socket.send(msg, this.destPort, this.destIp, (err, b) => {
      if (err) {
        console.log('UDP socket error:', err);
        this.socket.close();

        if (onFailure) {
          onFailure(err, b);
        }
      }
    });

    this.socket.close();
  }
}
