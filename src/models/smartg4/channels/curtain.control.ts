import { OverrideOpts, VarSwitchState } from 'src/types/smart_g4';
import { NetworkDevice } from '@internal/prisma/smartg4';
import { smartG4UdpSender } from 'src/services/smartg4/sender.service';
import { senderOpCodeMap } from 'src/utils/smart_g4';
import { ChannelNode } from './channel.node';
import { CurtainControlType } from 'src/constants/smart_g4';

interface VarSwitchControl extends VarSwitchState {
  RunningTime?: number;
}

export class CurtainControl extends ChannelNode<
  VarSwitchState,
  VarSwitchControl
> {
  constructor(props: VarSwitchState, channel: number, device?: NetworkDevice) {
    super(props);

    this.NetworkDevice = device;
    this.NodeNo = channel;
    this.NodeType = CurtainControlType;
  }

  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0x0033']({
      Target: {
        address: UseAddress || {
          SubnetId: this.NetworkDevice.SubnetId,
          DeviceId: this.NetworkDevice.DeviceId,
        },
        type: UseType || this.NetworkDevice.DeviceType,
      },
      ChannelNo: this.NodeNo,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error('Error sending query status message', err, bytes);
    });
  }

  setState({
    UseAddress,
    UseType,
    RunningTime,
    Status,
    Percentage,
  }: OverrideOpts & VarSwitchControl): Buffer {
    const msg = senderOpCodeMap['0x0031']({
      Target: {
        address: UseAddress || {
          SubnetId: this.NetworkDevice.SubnetId,
          DeviceId: this.NetworkDevice.DeviceId,
        },
        type: UseType || this.NetworkDevice.DeviceType,
      },
      ChannelNo: this.NodeNo,
      Status,
      Percentage: Percentage,
      RunningTime: RunningTime || 0,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error(
        `Error sending ${this.NodeType} set state message`,
        err,
        bytes,
      );
    });

    return msg;
  }
}
