import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/decorators/roles.decorator';
import { ChannelNode } from 'src/graphql/models/db/channel.node';
import { NetworkDevice } from 'src/graphql/models/db/network.device';
import { AuthGuard } from 'src/guards/admin.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { DeviceService } from 'src/services/db/device.service';

@Resolver()
export class NetworkDeviceMutations {
  constructor(
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => NetworkDevice)
  async AddDeviceToRoom(
    @Args('DeviceId', { type: () => Int }) deviceId: number,
    @Args('RoomId', { type: () => Int, nullable: true }) locationId: number | null,
  ) {
    return await this.deviceService.DeviceToRoom(deviceId, locationId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => Boolean)
  async DelDevice(
    @Args('DeviceId', { type: () => Int }) deviceId: number,
  ) {
    return !!(await this.deviceService.DelDevice(deviceId));
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => NetworkDevice)
  async SetDeviceDesc(
    @Args('DeviceId', { type: () => Int }) deviceId: number,
    @Args('Description') description: string,
  ) {
    return await this.deviceService.SetDeviceDesc(deviceId, description);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(['Admin'])
  @Mutation(() => ChannelNode)
  async SetDeviceNodeDesc(
    @Args('NodeId', { type: () => Int }) nodeId: number,
    @Args('Description') description: string,
  ) {
    return await this.deviceService.SetDeviceNodeDesc(nodeId, description);
  }
}
