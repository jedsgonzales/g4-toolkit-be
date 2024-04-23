import { Inject } from '@nestjs/common';
import type { SmartG4DbClient } from '@services';

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
