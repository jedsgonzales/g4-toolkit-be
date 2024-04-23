import { Channel } from './channel';

export class RelayChannel extends Channel {
  constructor({ ChannelNo, Status }: { ChannelNo: number; Status: boolean }) {
    super({ ChannelNo, Status });
    this.TypeName = 'Relay';
    this.TypeId = 1;
  }
}
