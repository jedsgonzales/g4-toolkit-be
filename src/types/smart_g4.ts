import { DRY_CONTACT_STATUS, DRY_CONTACT_TYPE, TEMP_UNIT } from '@constants';
import { DeviceAddress } from '@services';

export interface DeviceIdentity {
  address: DeviceAddress;
  type: number;
}

export interface SenderOpts {
  Source?: DeviceIdentity;
  Target: DeviceIdentity;
  ChannelNo: number;
}

export interface OverrideOpts {
  UseAddress?: DeviceAddress;
  UseType?: number;
  UseIpAddr?: string;
}

export interface HVACState {
  Status: boolean;
  CoolSetting: number;
  FanIndex: number;
  ModeIndex: number;
  CurrentTemp: number;
  HeatSetting: number;
  AutoSetting: number;
  TempUnit: TEMP_UNIT;
}

export type HVACStateControl = Omit<HVACState, 'CurrentTemp'>;

export interface SwitchState {
  Status: boolean;
}

export interface VarSwitchState extends SwitchState {
  Percentage: number;
}

export interface DryContactState {
  Type?: DRY_CONTACT_TYPE;
  Status: DRY_CONTACT_STATUS;
}

export interface MotionSensorState {
  MotionDetected: boolean;
}

export interface TempSensorState {
  CurrentTemp: number;
  TempUnit: TEMP_UNIT;
}
