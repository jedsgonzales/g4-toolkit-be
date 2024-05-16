import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from './prisma.service';

@Injectable()
export class NetworkBroacasterService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async all() {
    return await this.prisma.networkBroadcaster.findMany();
  }

  async byId(id: string) {
    return await this.prisma.networkBroadcaster.findUnique({
      where: {
        Id: id,
      },
    });
  }

  async findOrCreate(ip: string) {
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
