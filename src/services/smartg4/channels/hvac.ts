import { HVACState, HVACStateControl, OverrideOpts } from '@localtypes';
import { senderOpCodeMap } from '@utils';
import { smartG4UdpSender } from '../sender.service';
import { Channel } from './channel';
import { Device } from '../device';

export class HVAC extends Channel<HVACState, HVACStateControl> {
  AcNo: number;

  constructor(state: HVACState, acNo: number = 1, device?: Device) {
    super({ ...state });

    this.State = state;
    this.AcNo = acNo;
    this.ChannelDevice = device;
    this.TypeName = 'HVAC';
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0xe0ec']({
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
          SubnetId: this.ChannelDevice.SubnetId,
          DeviceId: this.ChannelDevice.DeviceId,
        },
        type: UseType || this.ChannelDevice.Type,
      },
      ChannelNo: this.ChannelNo,
      Status,
      AcNo: this.AcNo,
      ...rest,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error(
        `Error sending ${this.TypeName} set state message`,
        err,
        bytes,
      );
    });
  }
}
