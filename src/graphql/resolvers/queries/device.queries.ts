import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { ChannelNodeWithHistory } from 'src/graphql/models/db/channel.node';
import { NetworkBroadcaster } from 'src/graphql/models/db/network.broadcaster';
import { NetworkDevice } from 'src/graphql/models/db/network.device';
import { DeviceIdentityInput } from 'src/graphql/models/transient/device.identity.input';
import { HistoryArguments } from 'src/graphql/models/transient/history.arguments';
import { QueryArguments } from 'src/graphql/models/transient/query.arguments';
import { AuthGuard } from 'src/guards/admin.guard';
import { DeviceService } from 'src/services/db/device.service';
import { NetworkBroacasterService } from 'src/services/db/network.broadcaster.service';

@Resolver()
export class DeviceQueries {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly rsipService: NetworkBroacasterService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => [NetworkDevice])
  async AllDevices() {
    return await this.deviceService.All();
  }

  @UseGuards(AuthGuard)
  @Query(() => NetworkDevice)
  async DeviceById(@Args('Id') id: number) {
    return await this.deviceService.ById(id);
  }

  @UseGuards(AuthGuard)
  @Query(() => NetworkDevice)
  async DeviceByParams(@Args('Identity') id: DeviceIdentityInput) {
    return await this.deviceService.Find({
      ip: id.Ip || undefined,
      subnetId: id.SubnetId || undefined,
      deviceId: id.DeviceId || undefined,
      type: id.DeviceType || undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Query(() => [NetworkBroadcaster])
  async NetworkBroadcasters(
    @Args('Query', { nullable: true }) query?: QueryArguments | null,
  ) {
    return await this.rsipService.All(query);
  }

  @UseGuards(AuthGuard)
  @Query(() => [NetworkDevice])
  async NetworkDevices(
    @Args('Query', { nullable: true }) query?: QueryArguments | null,
    @Args('RSIP', { nullable: true }) rsip?: string,
  ) {
    return await this.deviceService.All(query, rsip);
  }

  @UseGuards(AuthGuard)
  @Query(() => NetworkDevice)
  async NetworkDevice(@Args('DeviceId', { type: () => Int }) deviceId: number) {
    return await this.deviceService.ById(deviceId);
  }

  @UseGuards(AuthGuard)
  @Query(() => ChannelNodeWithHistory)
  async DeviceChannelHistory(
    @Args('ChannelId', { type: () => Int }) nodeId: number,
    @Args() args: HistoryArguments,
  ) {
    return await this.deviceService.GetChannelNodeHistory(nodeId, args);
  }
}
