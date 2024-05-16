import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from './prisma.service';

@Injectable()
export class DeviceService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async all() {
    return await this.prisma.networkDevice.findMany({
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
    });
  }

  async byId(id: number) {
    return await this.prisma.networkDevice.findUnique({
      where: {
        Id: id,
      },
      include: {
        NetworkBroadcaster: true,
        Channels: true,
      },
    });
  }

  async find({
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

  async findOrCreate({
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
    }

    return existing;
  }

  async toggleDevices(ids: number[], status: boolean[], userId: string) {
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
}
