import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from './prisma.service';
import { queryGqlAPI, REPORT_NEW_DEVICE } from 'src/utils/pubsub.gql.api';
import { QueryArguments } from 'src/graphql/models/transient/query.arguments';
import { Prisma } from '@internal/prisma/smartg4';
import { HistoryArguments } from 'src/graphql/models/transient/history.arguments';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async All(query?: QueryArguments, rsipIp?: string) {
    const pageSize: number | undefined = !!query.PageSize
      ? query.PageSize
      : !!query.Cursor
        ? 10
        : undefined;

    let where: Prisma.NetworkDeviceFindManyArgs['where'] = rsipIp
    ? {
        ...(!!query.Where ? JSON.parse(query.Where) : undefined),
        BroadcasterId: rsipIp,
      }
    : !!query.Where
      ? JSON.parse(query.Where)
      : undefined;
      
    if(query.Filter){
      const whereOR = where.OR ? ( Array.isArray(where.OR) ? where.OR : [where.OR] ) : [];

      where = { ...where, OR: [
          ...whereOR,
          { CustomDesc: { contains: query.Filter } },
          { Area: { Name: { contains: query.Filter } } },
          { NetworkBroadcaster: { OR: [
            { Name: { contains: query.Filter } },
            { Id: { contains: query.Filter } },
          ] } },
        ],
      }

      if(query.Filter && !isNaN(parseInt(query.Filter))){
        (where.OR as Prisma.NetworkDeviceWhereInput[]).push(
          { DeviceId: Number(query.Filter) },
          { SubnetId: Number(query.Filter) },
          { DeviceType: Number(query.Filter) },
        )
      }
    }

    return await this.prisma.networkDevice.findMany({
      include: {
        NetworkBroadcaster: true,
        Channels: true,
        Area: true,
        _count: {
          select: { Channels: true },
        },
      },
      where,
      orderBy: !!query.Order ? JSON.parse(query.Order) : undefined,
      take: !!query.Cursor ? pageSize : undefined,
      cursor: !!query.Cursor ? JSON.parse(query.Cursor) : undefined,
    });
  }

  async DisabledDevices(query?: QueryArguments) {
    const pageSize: number | undefined = !!query.PageSize
      ? query.PageSize
      : !!query.Cursor
        ? 10
        : undefined;

    return await this.prisma.networkDevice.findMany({
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
      where: !!query.Where
        ? { ...JSON.parse(query.Where), DisabledOn: { not: null } }
        : undefined,
      orderBy: !!query.Order ? JSON.parse(query.Order) : undefined,
      take: !!query.Cursor ? pageSize : undefined,
      cursor: !!query.Cursor ? JSON.parse(query.Cursor) : undefined,
    });
  }

  async EnabledDevices(query?: QueryArguments) {
    const pageSize: number | undefined = !!query.PageSize
      ? query.PageSize
      : !!query.Cursor
        ? 10
        : undefined;

    return await this.prisma.networkDevice.findMany({
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
      where: !!query.Where
        ? { ...JSON.parse(query.Where), DisabledOn: null }
        : undefined,
      orderBy: !!query.Order ? JSON.parse(query.Order) : undefined,
      take: !!query.Cursor ? pageSize : undefined,
      cursor: !!query.Cursor ? JSON.parse(query.Cursor) : undefined,
    });
  }

  async ById(id: number) {
    return await this.prisma.networkDevice.findUnique({
      where: {
        Id: id,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: {
          include: {
            Status: true,
          }
        },
      },
    });
  }

  async Find({
    ip,
    subnetId,
    deviceId,
    type,
  }: {
    ip?: string;
    subnetId: number;
    deviceId: number;
    type?: number;
  }) {
    return await this.prisma.networkDevice.findFirst({
      where: {
        DeviceType: type,
        SubnetId: subnetId,
        DeviceId: deviceId,
        BroadcasterId: ip,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
    });
  }

  async FindOrCreate({
    ip,
    subnetId,
    deviceId,
    type,
  }: {
    ip: string;
    subnetId: number;
    deviceId: number;
    type?: number;
  }) {
    let existing = await this.prisma.networkDevice.findFirst({
      where: {
        DeviceType: type,
        SubnetId: subnetId,
        DeviceId: deviceId,
        BroadcasterId: ip,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: {
          include: {
            Status: true,
          },
        },
      },
    });

    if (!existing) {
      const now = DateTime.utc().toJSDate();
      const broadcaster = await this.prisma.networkBroadcaster.upsert({
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

      existing = await this.prisma.networkDevice.create({
        data: {
          DeviceType: type,
          SubnetId: subnetId,
          DeviceId: deviceId,
          NetworkBroadcaster: {
            connect: {
              Id: broadcaster.Id,
            },
          },
          CustomDesc: '',
        },
        include: {
          NetworkBroadcaster: true,
          Channels: {
            include: {
              Status: true,
            },
          },
        },
      });

      if (process.env['PUBSUB_API_URL']) {
        await queryGqlAPI(process.env['PUBSUB_API_URL'], REPORT_NEW_DEVICE, {
          id: existing.Id,
        });
      }
    }

    return existing;
  }

  async ToggleDevices(ids: number[], status: boolean[], userId: string) {
    const now = DateTime.utc().toJSDate();

    let targets = ids.filter((_id, idx) => status[idx]);
    if (targets.length) {
      await this.prisma.networkDevice.updateMany({
        where: {
          Id: {
            in: targets,
          },
        },
        data: {
          Enabled: true,
          EnabledOn: now,
          EnabledBy: userId,
        },
      });
    }

    targets = ids.filter((_id, idx) => !status[idx]);
    if (targets.length) {
      await this.prisma.networkDevice.updateMany({
        where: {
          Id: {
            in: targets,
          },
        },
        data: {
          Enabled: false,
          EnabledOn: now,
          EnabledBy: userId,
        },
      });
    }
  }

  async DeviceToRoom(deviceId: number, locationId?: number){
    return await this.prisma.networkDevice.update({
      where: { Id: deviceId },
      data: {
        Area: !!locationId ? { connect: { Id: locationId } } : null,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
    })
  }

  async SetDeviceDesc(deviceId: number, description: string){
    return await this.prisma.networkDevice.update({
      where: { Id: deviceId },
      data: {
        CustomDesc: description,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
    })
  }

  async SetDeviceNodeDesc(nodeId: number, description: string){
    return await this.prisma.deviceChannelNode.update({
      where: { Id: nodeId },
      data: {
        CustomDesc: description,
      },
    })
  }

  async GetChannelNodeHistory(channelId: number, args: HistoryArguments){
    const StartDate = args.StartDate || DateTime.fromFormat('1900-01-01T00:00:00', `yyyy-MM-ddTHH:mm:ss`).setZone('UTC').toJSDate();
    const EndDate  = args.EndDate || DateTime.utc().toJSDate();

    return this.prisma.deviceChannelNode.findUnique({
      where: { Id: channelId },
      include: {
        Status: true,
        NetworkDevice: true,
        History: {
          where: {
            AND: [
              { Time: { gte: StartDate } },
              { Time: { lte: EndDate } }
            ]
          },
          take: args.PageSize,
          cursor: !!args.LastId ? { Id: args.LastId } : undefined,
          orderBy: { Id: 'asc' }
        }
      }
    })
  }

  async DelDevice(deviceId: number){
    return await this.prisma.networkDevice.delete({
      where: { Id: deviceId },
    })
  }
}
