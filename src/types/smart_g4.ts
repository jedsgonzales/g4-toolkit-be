import { DeviceAddress } from 'src/models/smartg4/message/base_structure';

export enum TEMP_UNIT {
  CELSIUS = 1,
  FAHRENHEIT = 0,
}

export enum DRY_CONTACT_TYPE {
  NORMALLY_CLOSED = 0,
  NORMALLY_OPEN = 1,
}

export enum DRY_CONTACT_STATUS {
  CLOSED = 0,
  OPEN = 1,
}

export enum SystemFilterAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  DROP = 'ignore',
  PENDING = 'pending',
}

export enum AreaType {
  PROPERTY = 'Property',
  LEVEL = 'Level',
  FLOOR = 'Level',
  UNIT = 'Unit',
}

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

export interface OccupancySensorState {
  OccupancyDetected: boolean;
}

export interface TempSensorState {
  CurrentTemp: number;
  TempUnit: TEMP_UNIT;
}
