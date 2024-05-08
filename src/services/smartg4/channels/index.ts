import { NetworkDevice } from '@internal/prisma/smartg4';
import { CurtainControl } from './curtain.control';
import { Dimmer } from './dimmer';
import { DryContact } from './dry_contact';
import { HVAC } from './hvac';
import { MotionSensor } from './motion_sensor';
import { Relay } from './relay';
import { ChannelNode } from './channel.node';
import { TemperatureSensor } from './temperature_sensor';

export * from './channel.node';
export * from './curtain.control';
export * from './dimmer';
export * from './hvac';
export * from './motion_sensor';
export * from './relay';

export const createChannelNode = (
  nodeType: string,
  state: any,
  nodeNo: number,
  device: NetworkDevice,
): ChannelNode<any, any> => {
  switch (nodeType) {
    case 'Dimmer':
      return new Dimmer(state, nodeNo, device);
    case 'Relay':
      return new Relay(state, nodeNo, device);
    case 'CurtainControl':
      return new CurtainControl(state, nodeNo, device);
    case 'HVAC':
      return new HVAC(state, nodeNo, device);
    case 'MotionSensor':
      return new MotionSensor(state, nodeNo, device);
    case 'DryContact':
      return new DryContact(state, nodeNo, device);
    case 'TemperatureSensor':
      return new TemperatureSensor(state, nodeNo, device);
  }
};
