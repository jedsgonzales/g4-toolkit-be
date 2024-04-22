import { SystemFilter, SystemFilterAction } from '@internal/prisma/smartg4';
import { Inject } from '@nestjs/common';
import { SmartG4DbClient } from '@services';
import { DateTime } from 'luxon';
import { BaseStructure } from './message';
import { UdpListener } from './udp.listener.service';

export class SmartG4Reciever {
  listener: UdpListener;
  dataQueue: Buffer;
  filterTable: SystemFilter[] = [];

  constructor(
    @Inject('DB_CONNECTION') private readonly prismaService: SmartG4DbClient,
  ) {
    this.dataQueue = Buffer.from([]);
  }

  async startMonitoring() {
    // load and cache filter table
    this.filterTable = await this.prismaService.systemFilter.findMany({
      orderBy: {
        OrderNo: 'asc',
      },
    });

    this.listener = new UdpListener(
      Number(process.env['SMART_G4_PORT'] || 3000),
      async (msg: Buffer) => {
        console.log('Received message:', msg);

        const data = Buffer.from([...this.dataQueue, ...msg]);

        try {
          const baseParse = new BaseStructure(data);

          if (!this.isPacketAllowed(baseParse)) {
            console.error('Packet is disallowed:', baseParse);
          } else {
            const moment = DateTime.utc().toMillis();

            await this.prismaService.incomingMsg.create({
              data: {
                Id: `${moment}#${baseParse.OriginIp}#${baseParse.OriginAddress.SubnetId}#${baseParse.OriginAddress.DeviceId}`,
                TimeReceived: moment,
                SenderIp: baseParse.OriginIp,
                DeviceType: baseParse.DeviceType,
                OriginDevice: {
                  SubnetId: baseParse.OriginAddress.SubnetId,
                  DeviceId: baseParse.OriginAddress.DeviceId,
                },
                OpCode: baseParse.OpCode,
                TargetDevice: {
                  SubnetId: baseParse.TargetAddress.SubnetId,
                  DeviceId: baseParse.TargetAddress.DeviceId,
                },
                ContentLen: baseParse.Length,
                Content: Array.from(baseParse.Content),
              },
            });
          }

          if (baseParse.EndIndex <= data.length) {
            this.dataQueue = data.subarray(baseParse.EndIndex + 1);
          } else {
            this.dataQueue = Buffer.from([]);
          }
        } catch (ex: any) {
          console.error(ex.message);
        }
      },
    );
  }

  async isPacketAllowed(packet: BaseStructure) {
    let hasRule = false;
    let isAllowed = false; // default drop
    for (const filter of this.filterTable) {
      const ipPass = filter.Ip === '*' || filter.Ip === packet.OriginIp;
      const devIdPass =
        !filter.DeviceId ||
        filter.DeviceId === '*' ||
        filter.DeviceId === packet.OriginAddress.DeviceId.toString();
      const subnetPass =
        !filter.SubnetId ||
        filter.SubnetId === '*' ||
        filter.SubnetId === packet.OriginAddress.SubnetId.toString();

      if (ipPass && devIdPass && subnetPass) {
        hasRule = true;
        isAllowed = filter.FilterAction === SystemFilterAction.ACCEPT;
      }
    }

    if (!hasRule) {
      const ruleCount = await this.prismaService.systemFilter.count();
      await this.prismaService.systemFilter.create({
        data: {
          Ip: packet.OriginIp,
          OrderNo: ruleCount,
          DeviceId: packet.OriginAddress.DeviceId.toString(),
          SubnetId: packet.OriginAddress.SubnetId.toString(),
          FilterAction: SystemFilterAction.PENDING,
        },
      });
    }

    return isAllowed;
  }

  stopMonitoring() {
    if (this.listener) {
      this.listener.close();
    }
  }
}
