import { VarSwitchState } from '@localtypes';
import { DimmerChannel } from './dimmer';
import { Device } from '../device';

export class CurtainControlChannel extends DimmerChannel {
  constructor(props: VarSwitchState, channel: number, device?: Device) {
    super(props, channel, device);

    this.ChannelDevice = device;
    this.ChannelNo = channel;
    this.TypeName = 'CurtaineControl';
  }
}
