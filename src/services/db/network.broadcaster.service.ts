import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from './prisma.service';
import { QueryArguments } from 'src/graphql/models/transient/query.arguments';
import { Prisma } from '@internal/prisma/smartg4';

@Injectable()
export class NetworkBroacasterService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async All(query?: QueryArguments) {
    const pageSize: number | undefined = !!query.PageSize ? query.PageSize : (!!query.Cursor ? 10 : undefined);
    const deviceFilter: Prisma.NetworkDeviceListRelationFilter = {};

    if(query.Filter && !isNaN(parseInt(query.Filter))){
      deviceFilter.some = {
        OR: [
          { DeviceId: Number(query.Filter) },
          { SubnetId: Number(query.Filter) },
          { DeviceType: Number(query.Filter) },
        ]
      }
    }

    let where: Prisma.NetworkBroadcasterWhereInput = !!query.Where ? JSON.parse(query.Where) : undefined;
    if(query.Filter){
      const whereOR = where.OR ? ( Array.isArray(where.OR) ? where.OR : [where.OR] ) : [];
      where = { ...where, OR: [
          ...whereOR,
          { Name: { contains: query.Filter } },
          { Id: { contains: query.Filter } },
          { NetworkDevices: { some: {
            OR: [
              ...deviceFilter.some.OR,
              { CustomDesc: { contains: query.Filter } },
            ]
          } } }
        ],
      }
    }

    return await this.prisma.networkBroadcaster.findMany({
      where,
      orderBy: !!query.Order ? JSON.parse(query.Order) : undefined,
      include: {
        NetworkDevices: true,
        _count: {
          select: { NetworkDevices: true },
        },
      },
      take: !!query.Cursor ? pageSize : undefined,
      cursor: !!query.Cursor ? JSON.parse(query.Cursor) : undefined,
    });
  }

  async ById(id: string) {
    return await this.prisma.networkBroadcaster.findUnique({
      where: {
        Id: id,
      },
    });
  }

  async FindOrCreate(ip: string) {
    let existing = await this.prisma.networkBroadcaster.findUnique({
      where: {
        Id: ip,
      },
    });

    if (!existing) {
      const now = DateTime.utc().toJSDate();
      existing = await this.prisma.networkBroadcaster.upsert({
        where: {
          Id: ip,
        },
        create: {
          Id: ip,
          Name: `RSIP ${ip}`,
          DetectedOn: now,
          LastMsgOn: now,
        },
        update: {
          LastMsgOn: now,
        },
      });
    }

    return existing;
  }
}
