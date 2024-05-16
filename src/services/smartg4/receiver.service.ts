import { SystemFilter } from '@internal/prisma/smartg4';
import { Inject } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BaseStructure } from '../../models/smartg4/message';
import { UdpListener } from './udp.listener.service';
import { SYSTEM_IP, SystemFilterAction } from '@constants';
import { opCodeHex, responseOpCodeMap } from '@utils';
import { type SmartG4DbClient } from '../db/prisma.service';

export class SmartG4Reciever {
  listener: UdpListener;
  dataQueue: Buffer;
  filterTable: SystemFilter[] = [];

  constructor(
    @Inject('DB_CONNECTION') private readonly prismaService?: SmartG4DbClient,
  ) {
    this.dataQueue = Buffer.from([]);
  }

  async startMonitoring() {
    // load and cache filter table
    this.filterTable = this.prismaService
      ? await this.prismaService.systemFilter.findMany({
          orderBy: {
            OrderNo: 'asc',
          },
        })
      : [];

    console.log('LOAD', this.filterTable);

    const ignoredPackets: { [key: string]: boolean } = {};

    this.listener = new UdpListener(
      Number(process.env['SMART_G4_PORT'] || 6000),
      async (msg: Buffer) => {
        //console.log('\nReceived message:', msg);

        const data = Buffer.from([...this.dataQueue, ...msg]);

        try {
          const baseParse = new BaseStructure(data);

          if (!(await this.isPacketAllowed(baseParse))) {
            console.log(
              'Packet is disallowed or pending approval',
              baseParse.OriginIp,
              baseParse.OriginAddress,
            );
          } else if (baseParse.OriginIp === SYSTEM_IP) {
            // ignore from own IP
          } else if (!responseOpCodeMap[opCodeHex(baseParse.OpCode)]) {
            // ignore un mapped op codes
            const ignoreKey = Array.from(msg)
              .map((b) => b.toString(16))
              .join('');
            if (!ignoredPackets[ignoreKey]) {
              console.log(
                'Packet is dropped by OpCode mapping',
                baseParse.OriginIp,
                baseParse.OriginAddress,
                opCodeHex(baseParse.OpCode),
              );
              console.log(msg);
              ignoredPackets[ignoreKey] = true;
            }
          } else {
            const moment = DateTime.utc().toMillis();

            this.prismaService &&
              (await this.prismaService.incomingMsg.create({
                data: {
                  TimeReceived: moment,
                  SenderIp: baseParse.OriginIp,
                  DeviceType: baseParse.DeviceType,
                  OriginDeviceId: baseParse.OriginAddress.DeviceId,
                  OriginSubnetId: baseParse.OriginAddress.SubnetId,
                  OpCode: baseParse.OpCode,
                  TargetDeviceId: baseParse.TargetAddress.DeviceId,
                  TargetSubnetId: baseParse.TargetAddress.SubnetId,
                  ContentLen: baseParse.Length,
                  Raw: baseParse.Raw,
                },
              }));
          }

          if (baseParse.EndIndex <= data.length) {
            this.dataQueue = data.subarray(baseParse.EndIndex);
          } else {
            this.dataQueue = Buffer.from([]);
          }
        } catch (ex: any) {
          console.error(ex.message);
        }
      },
    );

    this.listener.listen();
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
        isAllowed = filter.FilterAction === SystemFilterAction.ALLOW;
      }
    }

    if (!hasRule && !!this.prismaService) {
      console.log(
        '\n+++++ Add Pending Rule +++++',
        packet.OriginIp,
        packet.OriginAddress,
      );
      const ruleCount = this.filterTable.length;
      await this.prismaService.systemFilter.create({
        data: {
          Ip: packet.OriginIp,
          OrderNo: ruleCount,
          DeviceId: packet.OriginAddress.DeviceId.toString(),
          SubnetId: packet.OriginAddress.SubnetId.toString(),
          FilterAction: SystemFilterAction.PENDING,
        },
      });

      // reload filter table
      this.filterTable = await this.prismaService.systemFilter.findMany({
        orderBy: {
          OrderNo: 'asc',
        },
      });

      console.log('\nReloaded Filters ^^^^^^', this.filterTable);
    }

    return isAllowed;
  }

  stopMonitoring() {
    if (this.listener) {
      this.listener.close();
    }
  }
}
