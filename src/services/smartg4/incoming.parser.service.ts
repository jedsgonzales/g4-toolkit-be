import { Inject } from '@nestjs/common';
import { SmartG4DbClient } from '@services';
import { DateTime } from 'luxon';
import { BaseStructure } from './message';
import { UdpListener } from './udp.listener.service';

export class IncomingParser {
  shutdown = false;
  constructor(
    @Inject('DB_CONNECTION') private readonly prismaService: SmartG4DbClient,
  ) {}

  async startMonitoring() {
    while (!this.shutdown) {
      const top = await this.prismaService.incomingMsg.findFirst({
        take: 1,
        orderBy: {
          TimeReceived: 'asc',
        },
      });

      const bulk = await this.prismaService.incomingMsg.findMany({
        take: 9999,
        orderBy: {
          TimeReceived: 'asc',
        },
        where: {
          TargetDevice: {
            SubnetId: top.TargetDevice.SubnetId,
            DeviceId: top.TargetDevice.DeviceId,
          },
        },
      });

      for (const incomingMsg of bulk) {
        
      }
    }
  }

  stopMonitoring() {
    this.shutdown = true;
  }
}
