import { TempSensorState, OverrideOpts } from 'src/types/smart_g4';
import { ChannelNode } from './channel.node';
import { NetworkDevice } from '@internal/prisma/smartg4';

export const TemperatureSensorType = 'TemperatureSensor';

export class TemperatureSensor extends ChannelNode<TempSensorState, null> {
  constructor(state: TempSensorState, sensor?: number, device?: NetworkDevice) {
    super(state);

    this.NetworkDevice = device;
    this.NodeNo = sensor || 1;
    this.NodeType = TemperatureSensorType;
  }

  /**
   * Default query as a relay channel.
   * @param param0
   */
  public queryStatus({} /* UseAddress, UseType */ : OverrideOpts) {
    /* const msg = senderOpCodeMap['0xdb00']({
      Target: {
        address: UseAddress || {
          SubnetId: this.NetworkDevice.SubnetId,
          DeviceId: this.NetworkDevice.DeviceId,
        },
        type: UseType || this.NetworkDevice.Type,
      },
      ChannelNo: this.NodeNo,
    });

    smartG4UdpSender.Send(msg, (err, bytes) => {
      console.error('Error sending query status message', err, bytes);
    }); */
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
