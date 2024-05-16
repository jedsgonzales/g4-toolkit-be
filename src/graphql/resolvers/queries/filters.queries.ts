import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { SystemFilter, NetworkDevice } from 'src/graphql/models';
import { AuthAdminGuard } from 'src/guards/admin.guard';
import type { SmartG4DbClient } from 'src/services/db/prisma.service';

@Resolver()
export class FiltersQueries {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  @UseGuards(AuthAdminGuard)
  @Query(() => [SystemFilter])
  async AllSourceFilters() {
    const filters = await this.prisma.systemFilter.findMany({
      orderBy: {
        OrderNo: 'asc',
      },
    });

    return filters;
  }

  @UseGuards(AuthAdminGuard)
  @Query(() => [NetworkDevice])
  async AllDeviceFilters() {
    const filters = await this.prisma.networkDevice.findMany({
      include: {
        NetworkBroadcaster: true,
        Area: true,
      },
      orderBy: {
        NetworkBroadcaster: {
          LastMsgOn: 'desc',
        },
        SubnetId: 'asc',
        DeviceId: 'asc',
      },
    });

    return filters;
  }
}
