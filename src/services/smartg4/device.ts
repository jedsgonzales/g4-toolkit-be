export class Device {
  constructor(
    public readonly Ip: string,
    public readonly UdpPort: number,
    public readonly Type: number,
    public readonly SubnetId: number,
    public readonly DeviceId: number,
  ) {}
}
