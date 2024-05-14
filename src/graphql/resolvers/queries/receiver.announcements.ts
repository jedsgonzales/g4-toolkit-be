import { LocalhostGuard } from '@guards';
import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import {
  AreaService,
  ChannelNode,
  ChannelNodeService,
  DeviceService,
} from '@services';
import { pubSub } from 'src/app.module';
import {
  Area,
  NetworkBroadcasterBase,
  NetworkDevice,
} from 'src/graphql/models';
import { NetworkBroacasterService } from 'src/services/db/network.broadcaster.service';

@Resolver()
export class ReceiverAnnouncements {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly networkBroacasterService: NetworkBroacasterService,
    private readonly channelNodeService: ChannelNodeService,
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

  // =================================================

  @UseGuards(LocalhostGuard)
  @Query(() => NetworkBroadcasterBase)
  async AnnounceNewBroadcaster(@Args('ip') ip: string) {
    const broadcaster = await this.networkBroacasterService.byId(ip);

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
    @Args('id') id: number,
    @Args('subnet') subnet: number,
  ) {
    const device = await this.deviceService.find({
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
  async AnnounceNodeStateChanged(@Args('id') id: number) {
    const node = await this.channelNodeService.byId(id);

    if (node)
      pubSub.publish('ChannelNodeStateChanged', {
        ChannelNodeStateChanged: node,
      });

    return node;
  }

  @UseGuards(LocalhostGuard)
  @Query(() => Area)
  async AnnounceAreaOccupancy(@Args('id') id: number) {
    const area = await this.areaService.byId(id);

    if (area)
      pubSub.publish('AreaOccupancyStateChanged', {
        AreaOccupancyStateChanged: area,
      });

    return area;
  }
}
