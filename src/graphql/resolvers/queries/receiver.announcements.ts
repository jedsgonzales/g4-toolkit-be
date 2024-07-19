import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Area } from 'src/graphql/models/db/area';
import { ChannelNode } from 'src/graphql/models/db/channel.node';
import { NetworkBroadcasterBase } from 'src/graphql/models/db/network.broadcaster';
import { NetworkDevice } from 'src/graphql/models/db/network.device';
import { SystemFilter } from 'src/graphql/models/db/system.filter';
import { LocalhostGuard } from 'src/guards/localhost.guard';
import { AreaService } from 'src/services/db/area.service';
import { ChannelNodeService } from 'src/services/db/channel.node.service';
import { DeviceService } from 'src/services/db/device.service';
import { NetworkBroacasterService } from 'src/services/db/network.broadcaster.service';
import { SystemFilterService } from 'src/services/db/system.filter.service';
import { pubSub } from 'src/services/pubsub';

@Resolver()
export class ReceiverAnnouncements {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly networkBroacasterService: NetworkBroacasterService,
    private readonly channelNodeService: ChannelNodeService,
    private readonly systemFilterService: SystemFilterService,
    @Inject(forwardRef(() => AreaService))
    private readonly areaService: AreaService,
  ) {}

  @Subscription(() => NetworkBroadcasterBase)
  BroadcasterDetected() {
    pubSub.asyncIterator('BroadcasterDetected');
  }

  @Subscription(() => NetworkDevice)
  DeviceDetected() {
    pubSub.asyncIterator('DeviceDetected');
  }

  @Subscription(() => ChannelNode)
  ChannelNodeStateChanged() {
    pubSub.asyncIterator('ChannelNodeStateChanged');
  }

  @Subscription(() => Area)
  AreaOccupancyStateChanged() {
    pubSub.asyncIterator('AreaOccupancyStateChanged');
  }

  @Subscription(() => Area)
  NewSystemFilterCreated() {
    pubSub.asyncIterator('NewSystemFilterCreated');
  }

  // =================================================

  @UseGuards(LocalhostGuard)
  @Query(() => NetworkBroadcasterBase)
  async AnnounceNewBroadcaster(@Args('ip') ip: string) {
    const broadcaster = await this.networkBroacasterService.ById(ip);

    if (broadcaster)
      pubSub.publish('BroadcasterDetected', {
        BroadcasterDetected: broadcaster,
      });

    return broadcaster;
  }

  @UseGuards(LocalhostGuard)
  @Query(() => NetworkBroadcasterBase)
  async AnnounceNewDevice(
    @Args('ip') ip: string,
    @Args({ name: 'id', type: () => Int }) id: number,
    @Args({ name: 'subnet', type: () => Int }) subnet: number,
  ) {
    const device = await this.deviceService.Find({
      ip,
      deviceId: id,
      subnetId: subnet,
    });

    if (device)
      pubSub.publish('DeviceDetected', {
        DeviceDetected: device,
      });

    return device;
  }

  @UseGuards(LocalhostGuard)
  @Query(() => ChannelNode)
  async AnnounceNodeStateChanged(
    @Args({ name: 'id', type: () => Int }) id: number,
  ) {
    const node = await this.channelNodeService.byId(id);

    if (node)
      pubSub.publish('ChannelNodeStateChanged', {
        ChannelNodeStateChanged: node,
      });

    return node;
  }

  @UseGuards(LocalhostGuard)
  @Query(() => Area)
  async AnnounceAreaOccupancy(
    @Args({ name: 'id', type: () => Int }) id: number,
  ) {
    const area = await this.areaService.byId(id);

    if (area)
      pubSub.publish('AreaOccupancyStateChanged', {
        AreaOccupancyStateChanged: area,
      });

    return area;
  }

  @UseGuards(LocalhostGuard)
  @Query(() => SystemFilter)
  async AnnounceNewSystemFilter(@Args('id') id: string) {
    const filter = await this.systemFilterService.byId(id);

    if (filter)
      pubSub.publish('NewSystemFilterCreated', {
        NewSystemFilterCreated: filter,
      });

    return filter;
  }
}
