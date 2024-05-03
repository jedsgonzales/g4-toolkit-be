import { DryContactState, OverrideOpts } from '@localtypes';
import { senderOpCodeMap } from '@utils';
import { smartG4UdpSender } from '../sender.service';
import { Channel } from './channel';
import { Device } from '../device';

export class DryContact extends Channel<DryContactState, null> {
  ContactNo: number;

  constructor(state: DryContactState, contact: number, device?: Device) {
    super(state);

    this.ChannelDevice = device;
    this.ContactNo = contact;
    this.TypeName = 'DryContact';
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0x012c']({
      Target: {
        address: UseAddress || {
          SubnetId: this.ChannelDevice.SubnetId,
          DeviceId: this.ChannelDevice.DeviceId,
        },
        type: UseType || this.ChannelDevice.Type,
      },
      ChannelNo: this.ChannelNo,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error('Error sending query status message', err, bytes);
    });
  }

  public setState({} /* UseAddress, UseType, Status */ : OverrideOpts) {
    /* const msg = senderOpCodeMap['0x0031']({
      Target: {
        address: UseAddress || {
          SubnetId: this.ChannelDevice.SubnetId,
          DeviceId: this.ChannelDevice.DeviceId,
        },
        type: UseType || this.ChannelDevice.Type,
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
