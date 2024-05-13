import { SystemFilterAction } from '@constants';
import { SystemFilterInput } from '@graphql';
import { Inject, Injectable } from '@nestjs/common';
import { SmartG4DbClient } from '@services';
import { DateTime } from 'luxon';

@Injectable()
export class SystemFilterService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async listFilters() {
    return await this.prisma.systemFilter.findMany({
      orderBy: {
        OrderNo: 'asc',
      },
    });
  }

  async saveFilter(input: SystemFilterInput, UserId: string) {
    const now = DateTime.utc().toJSDate();

    const { Id, ...data } = input;
    const filter = !!Id
      ? await this.prisma.systemFilter.update({
          where: {
            Id,
          },
          data: {
            ...data,
            UpdatedOn: now,
            UpdatedBy: UserId,
          },
        })
      : await this.prisma.systemFilter.create({
          data: {
            ...data,
            UpdatedOn: now,
            UpdatedBy: UserId,
          },
        });

    if (!Id) {
      await this.reOrderFilters();
    }

    const broadcasterProfile = await this.prisma.networkBroadcaster.findFirst({
      where: {
        Id: filter.Ip,
      },
    });

    if (!broadcasterProfile) {
      await this.prisma.networkBroadcaster.create({
        data: {
          Id: filter.Ip,
          Enabled: filter.FilterAction === SystemFilterAction.ALLOW,
          EnabledOn: now,
          LastMsgOn: filter.DetectedOn,
          DetectedOn: filter.DetectedOn,
        },
      });
    } else {
      await this.prisma.networkBroadcaster.update({
        where: {
          Id: broadcasterProfile.Id,
        },
        data: {
          Enabled: filter.FilterAction === SystemFilterAction.ALLOW,
          EnabledOn:
            filter.FilterAction === SystemFilterAction.ALLOW ? now : undefined,
          DisabledOn:
            filter.FilterAction !== SystemFilterAction.ALLOW ? now : undefined,
          DisabledBy:
            filter.FilterAction !== SystemFilterAction.ALLOW
              ? UserId
              : undefined,
        },
      });
    }

    return filter;
  }

  async deleteFilter(id: string) {
    const filter = await this.prisma.systemFilter.delete({
      where: {
        Id: id,
      },
    });

    return filter;
  }

  async reOrderFilters() {
    const filters = await this.prisma.systemFilter.findMany({
      orderBy: {
        OrderNo: 'asc',
      },
    });

    for (let i = 0; i < filters.length; i++) {
      await this.prisma.systemFilter.update({
        where: {
          Id: filters[i].Id,
        },
        data: {
          OrderNo: i,
        },
      });
    }
  }
}
