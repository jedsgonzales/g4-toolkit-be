import { MotionSensorState, OverrideOpts } from '@localtypes';
import { senderOpCodeMap } from '@utils';
import { smartG4UdpSender } from '../sender.service';
import { Channel } from './channel';
import { Device } from '../device';

export class MotionSensor extends Channel<MotionSensorState, null> {
  SensorNo: number;

  constructor(state: MotionSensorState, sensor: number, device?: Device) {
    super(state);

    this.ChannelDevice = device;
    this.SensorNo = sensor;
    this.TypeName = 'MotionSensor';
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({ UseAddress, UseType }: OverrideOpts) {
    const msg = senderOpCodeMap['0xdb00']({
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
