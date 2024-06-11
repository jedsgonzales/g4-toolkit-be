import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SystemFilterInput } from 'src/graphql/models/db/system.filter';
import { SystemFilterAction } from 'src/types/smart_g4';
import {
  queryGqlAPI,
  REPORT_NEW_SYSTEM_FILTER,
  REPORT_NEW_BROADCASTER,
} from 'src/utils/pubsub.gql.api';
import { type SmartG4DbClient } from './prisma.service';
import { Prisma } from '@internal/prisma/smartg4';

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

  async listPendingFilters() {
    return await this.prisma.systemFilter.findMany({
      where: {
        FilterAction: SystemFilterAction.PENDING,
      },
      orderBy: {
        OrderNo: 'asc',
      },
    });
  }

  async listCurrentFilters() {
    return await this.prisma.systemFilter.findMany({
      where: {
        FilterAction: { not: SystemFilterAction.PENDING },
      },
      orderBy: {
        OrderNo: 'asc',
      },
    });
  }

  async byId(Id: string) {
    return await this.prisma.systemFilter.findUnique({
      where: {
        Id,
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

    const scopeUpdate: Prisma.SystemFilterWhereInput = {};
    if (data.Ip === '*') {
      scopeUpdate.Ip = { not: null };
    } else {
      scopeUpdate.Ip = data.Ip;
    }

    if (data.SubnetId === '*') {
      scopeUpdate.SubnetId = { not: null };
    } else {
      scopeUpdate.SubnetId = data.SubnetId;
    }

    if (data.DeviceId === '*') {
      scopeUpdate.DeviceId = { not: null };
    }

    if (Object.keys(scopeUpdate).length) {
      await this.prisma.systemFilter.deleteMany({
        where: { ...scopeUpdate, Id: { not: filter.Id } },
      });
    }

    // repoprt new pending rule to pubsub
    if (!Id && process.env['PUBSUB_API_URL']) {
      await queryGqlAPI(
        process.env['PUBSUB_API_URL'],
        REPORT_NEW_SYSTEM_FILTER,
        {
          id: filter.Id,
        },
      );
    }

    if (!Id) {
      await this.reOrderFilters();
    }

    const broadcasterProfile = await this.prisma.networkBroadcaster.findFirst({
      where: {
        Id: filter.Ip,
      },
    });

    if (!broadcasterProfile) {
      const newBroadcaster = await this.prisma.networkBroadcaster.create({
        data: {
          Id: filter.Ip,
          Enabled: filter.FilterAction === SystemFilterAction.ALLOW,
          EnabledOn: now,
          LastMsgOn: filter.DetectedOn,
          DetectedOn: filter.DetectedOn,
        },
      });

      if (process.env['PUBSUB_API_URL']) {
        await queryGqlAPI(
          process.env['PUBSUB_API_URL'],
          REPORT_NEW_BROADCASTER,
          {
            ip: newBroadcaster.Id,
          },
        );
      }
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

  async deleteFilter(id: string[]) {
    const filter = await this.prisma.systemFilter.deleteMany({
      where: {
        Id: { in: id },
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
