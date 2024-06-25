import { SwitchState, OverrideOpts } from 'src/types/smart_g4';
import { senderOpCodeMap } from 'src/utils/smart_g4';
import { smartG4UdpSender } from '../../../services/smartg4/sender.service';
import { ChannelNode } from './channel.node';
import { NetworkDevice } from '@internal/prisma/smartg4';
import { RelayType } from 'src/constants/smart_g4';

export class Relay extends ChannelNode<SwitchState, SwitchState> {
  constructor(state: SwitchState, channel: number, device?: NetworkDevice) {
    super(state);

    this.NetworkDevice = device;
    this.NodeNo = channel;
    this.NodeType = RelayType;
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
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

  public setState({ UseAddress, UseType, Status }: OverrideOpts & SwitchState) {
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
      RunningTime: 0,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error(
        `Error sending ${this.NodeType} set state message`,
        err,
        bytes,
      );
    });
  }
}
