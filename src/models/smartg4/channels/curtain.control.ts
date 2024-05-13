import { VarSwitchState } from '@localtypes';
import { Dimmer } from './dimmer';
import { NetworkDevice } from '@internal/prisma/smartg4';

export const CurtainControlType = 'CurtainControl';
export class CurtainControl extends Dimmer {
  constructor(props: VarSwitchState, channel: number, device?: NetworkDevice) {
    super(props, channel, device);

    this.NetworkDevice = device;
    this.NodeNo = channel;
    this.NodeType = CurtainControlType;
  }
}
