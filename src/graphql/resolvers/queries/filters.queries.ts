import { NetworkDevice, SystemFilter } from '@graphql';
import { AuthAdminGuard } from '@guards';
import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { SmartG4DbClient } from '@services';

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
