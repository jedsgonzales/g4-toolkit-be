import { HVACState, HVACStateControl, OverrideOpts } from '@localtypes';
import { senderOpCodeMap } from '@utils';
import { smartG4UdpSender } from '../../../services/smartg4/sender.service';
import { ChannelNode } from './channel.node';
import { NetworkDevice } from '@internal/prisma/smartg4';

export const HVACType = 'HVAC';
export class HVAC extends ChannelNode<HVACState, HVACStateControl> {
  constructor(state: HVACState, acNo: number = 1, device?: NetworkDevice) {
    super({ ...state });

    this.State = state;
    this.NodeNo = acNo;
    this.NetworkDevice = device;
    this.NodeType = HVACType;
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0xe0ec']({
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
      console.error('Error sending HVAC query status message', err, bytes);
    });

    return msg;
  }

  public setState({
    UseAddress,
    UseType,
    Status,
    ...rest
  }: OverrideOpts & HVACStateControl) {
    const msg = senderOpCodeMap['0x193a']({
      Target: {
        address: UseAddress || {
          SubnetId: this.NetworkDevice.SubnetId,
          DeviceId: this.NetworkDevice.DeviceId,
        },
        type: UseType || this.NetworkDevice.DeviceType,
      },
      ChannelNo: this.NodeNo,
      Status,
      AcNo: this.NodeNo,
      ...rest,
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
