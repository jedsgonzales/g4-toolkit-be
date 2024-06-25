import { DryContactState, OverrideOpts } from 'src/types/smart_g4';
import { senderOpCodeMap } from 'src/utils/smart_g4';
import { smartG4UdpSender } from '../../../services/smartg4/sender.service';
import { ChannelNode } from './channel.node';
import { NetworkDevice } from '@internal/prisma/smartg4';
import { DryContactType } from 'src/constants/smart_g4';

export class DryContact extends ChannelNode<DryContactState, null> {
  constructor(state: DryContactState, contact: number, device?: NetworkDevice) {
    super(state);

    this.NetworkDevice = device;
    this.NodeNo = contact;
    this.NodeType = DryContactType;
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0x012c']({
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

  public setState({} /* UseAddress, UseType, Status */ : OverrideOpts) {
    /* const msg = senderOpCodeMap['0x0031']({
      Target: {
        address: UseAddress || {
          SubnetId: this.NetworkDevice.SubnetId,
          DeviceId: this.NetworkDevice.DeviceId,
        },
        type: UseType || this.NetworkDevice.Type,
      },
      ChannelNo: this.ChannelNo,
      Status,
      RunningTime: 0,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error(
        `Error sending ${this.TypeName} set state message`,
        err,
        bytes,
      );
    }); */
  }
}
