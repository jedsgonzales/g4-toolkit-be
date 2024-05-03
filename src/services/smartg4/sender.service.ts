import { LEAD_CODES, SMARTCLOUD, SMARTG4_SENDER_IP } from '@constants';
import { UdpSender } from './udp.sender.service';

export class SenderService {
  Sender: UdpSender;
  constructor() {
    this.Sender = new UdpSender(
      Number(process.env['SMART_G4_PORT'] || 3000),
      process.env['SMART_G4_IP'] || '127.0.0.1',
    );
  }

  async Send(msg: Buffer, errCallback: (err, bytes) => void) {
    this.Sender.sendSocketMsg(
      Buffer.from([...SMARTG4_SENDER_IP, ...SMARTCLOUD, ...LEAD_CODES, ...msg]),
      errCallback ||
        ((err, bytes) => {
          console.error('Error sending message', err, bytes);
        }),
    );
  }
}

export const smartG4UdpSender = new SenderService();
