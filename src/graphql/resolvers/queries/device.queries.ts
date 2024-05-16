import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { NetworkDevice, DeviceIdentityInput } from 'src/graphql/models';
import { AuthAdminGuard } from 'src/guards/admin.guard';
import { DeviceService } from 'src/services/db/device.service';

@Resolver()
export class DeviceQueries {
  constructor(
    /* @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient, */
    private readonly deviceService: DeviceService,
  ) {}

  @UseGuards(AuthAdminGuard)
  @Query(() => [NetworkDevice])
  async AllDevices() {
    return await this.deviceService.all();
  }

  @UseGuards(AuthAdminGuard)
  @Query(() => NetworkDevice)
  async DeviceById(@Args('id') id: number) {
    return await this.deviceService.byId(id);
  }

  @UseGuards(AuthAdminGuard)
  @Query(() => NetworkDevice)
  async DeviceByParams(@Args('identity') id: DeviceIdentityInput) {
    return await this.deviceService.find({
      ip: id.Ip || undefined,
      subnetId: id.SubnetId || undefined,
      deviceId: id.DeviceId || undefined,
      type: id.DeviceType || undefined,
    });
  }
}
