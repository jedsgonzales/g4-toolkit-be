import { NetworkDevice } from '@internal/prisma/smartg4';
import { ChannelNode } from './channel.node';
import { OccupancySensorState, OverrideOpts } from 'src/types/smart_g4';
import { OccupiedSensorType } from 'src/constants/smart_g4';

export class OccupancySensor extends ChannelNode<OccupancySensorState, null> {
  constructor(
    state: OccupancySensorState,
    sensor: number,
    device?: NetworkDevice,
  ) {
    super(state);

    this.NetworkDevice = device;
    this.NodeNo = sensor;
    this.NodeType = OccupiedSensorType;
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
        type: UseType || this.NetworkDevice.DeviceType,
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
