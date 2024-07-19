import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { NetworkDevice } from 'src/graphql/models/db/network.device';
import { SystemFilter } from 'src/graphql/models/db/system.filter';
import { AuthGuard } from 'src/guards/admin.guard';
import { DeviceService } from 'src/services/db/device.service';
import { SystemFilterService } from 'src/services/db/system.filter.service';

@Resolver()
export class FilterQueries {
  constructor(
    private readonly systemFilterService: SystemFilterService,
    private readonly deviceService: DeviceService,
  ) {}

  @UseGuards(AuthGuard)
  @Query(() => [SystemFilter])
  async AllSourceFilters() {
    return await this.systemFilterService.listFilters();
  }

  @UseGuards(AuthGuard)
  @Query(() => [SystemFilter])
  async PendingSourceFilters() {
    return await this.systemFilterService.listPendingFilters();
  }

  @UseGuards(AuthGuard)
  @Query(() => [SystemFilter])
  async CurrentSourceFilters() {
    return await this.systemFilterService.listCurrentFilters();
  }

  @UseGuards(AuthGuard)
  @Query(() => [NetworkDevice])
  async AllDeviceFilters() {
    return await this.deviceService.All();
  }

  @UseGuards(AuthGuard)
  @Query(() => [NetworkDevice])
  async DisabledDevices() {
    return await this.deviceService.DisabledDevices();
  }

  @UseGuards(AuthGuard)
  @Query(() => [NetworkDevice])
  async ActiveDevices() {
    return await this.deviceService.EnabledDevices();
  }
}
