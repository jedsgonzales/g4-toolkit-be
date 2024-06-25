import { Inject } from '@nestjs/common';
import { pause } from 'src/utils/pause';
import { type SmartG4DbClient } from '../db/prisma.service';
import { DeviceService } from '../db/device.service';
import {
  createChannelNode,
  opCodeHex,
  responseOpCodeMap,
} from 'src/utils/smart_g4';
import { TEMP_SENSOR_GROUP, SWITCH_GROUP } from 'src/constants/smart_g4';
import { BaseStructure } from 'src/models/smartg4/message/base_structure';
export class IncomingParser {
  shutdown = false;
  constructor(
    @Inject('DB_CONNECTION') private readonly prismaService: SmartG4DbClient,
    private readonly deviceService: DeviceService,
  ) {}

  async startMonitoring() {
    console.log(' monitoring incoming messages...');
    while (!this.shutdown) {
      const top = await this.prismaService.incomingMsg.findFirst({
        take: 1,
        orderBy: {
          TimeReceived: 'asc',
        },
      });

      if (!top) {
        // console.log('no messages to process...');
        await pause(1000);
        continue;
      }

      console.log('bulk processing messages from', {
        TargetDeviceId: top.TargetDeviceId,
        TargetSubnetId: top.TargetSubnetId,
        DeviceType: top.DeviceType,
        SenderIp: top.SenderIp,
      });

      const bulk = await this.prismaService.incomingMsg.findMany({
        take: 9999,
        orderBy: {
          TimeReceived: 'asc',
        },
        where: {
          TargetDeviceId: top.TargetDeviceId,
          TargetSubnetId: top.TargetSubnetId,
          DeviceType: top.DeviceType,
          SenderIp: top.SenderIp,
        },
      });

      for (const incomingMsg of bulk) {
        console.log('incoming message', incomingMsg.Id, incomingMsg.Raw);

        const packet = new BaseStructure(incomingMsg.Raw);
        const opCode = opCodeHex(packet.OpCode);

        console.log('incoming opcode', opCode);
        console.log('cmd structure', packet);

        if (responseOpCodeMap[opCode]) {
          console.log('\tcalling opcode handler', opCode);
          const channelList = responseOpCodeMap[opCode](packet);

          const device = await this.deviceService.findOrCreate({
            ip: incomingMsg.SenderIp,
            subnetId: incomingMsg.TargetSubnetId,
            deviceId: incomingMsg.TargetDeviceId,
            type: incomingMsg.DeviceType,
          });

          for (const channelNode of channelList) {
            let node = device.Channels.find(
              (channel) =>
                channel.NodeNo === channelNode.NodeNo &&
                channel.NodeType === channelNode.NodeType,
            );

            let nodeUpdated = false;
            if (!node) {
              console.log('cant find node match, maybe an upgrade for type', channelNode.NodeNo, channelNode.NodeType);
              console.debug('switch types', SWITCH_GROUP);
              console.debug('sensor types', TEMP_SENSOR_GROUP);

              console.debug('from sensors', TEMP_SENSOR_GROUP.includes(channelNode.NodeType));
              console.debug('from switches', SWITCH_GROUP.includes(channelNode.NodeType));

              // detect variance, update as necessary
              if (TEMP_SENSOR_GROUP.includes(channelNode.NodeType)) {
                node = device.Channels.find(
                  (channel) =>
                    channel.NodeNo === channelNode.NodeNo &&
                    TEMP_SENSOR_GROUP.includes(channel.NodeType),
                );

                if (
                  node &&
                  TEMP_SENSOR_GROUP.indexOf(node.NodeType) <
                    TEMP_SENSOR_GROUP.indexOf(channelNode.NodeType)
                ) {
                  node.NodeType = channelNode.NodeType;
                  nodeUpdated = true;
                }
              } else if (SWITCH_GROUP.includes(channelNode.NodeType)) {
                node = device.Channels.find(
                  (channel) =>
                    channel.NodeNo === channelNode.NodeNo &&
                    SWITCH_GROUP.includes(channel.NodeType),
                );

                console.debug('found related type', node );
                
                console.debug('old node', node, SWITCH_GROUP.indexOf(node.NodeType));
                console.debug('old node', node, SWITCH_GROUP.indexOf(node.NodeType));
                console.debug('new node', channelNode, SWITCH_GROUP.indexOf(channelNode.NodeType));

                if (
                  node &&
                  SWITCH_GROUP.indexOf(node.NodeType) <
                    SWITCH_GROUP.indexOf(channelNode.NodeType)
                ) {
                  node.NodeType = channelNode.NodeType;
                  nodeUpdated = true;
                }
              }
            }

            console.log('node parsed', node);
            // console.log('node type', node?.NodeType || channelNode.NodeType);
            const nodeInstance = createChannelNode(
              node?.NodeType || channelNode.NodeType,
              node?.Status.map((status) => ({
                [status.StateName]: status.StateValue,
              })) || channelNode.State,
              node?.NodeNo || channelNode.NodeNo,
              device,
            );

            if (node) {
              nodeInstance.Id = node.Id;
              nodeInstance.updateState(channelNode.State);
            }

            if (!node || nodeUpdated) {
              // console.log('node syncing...');
              await nodeInstance.syncNode();
            }

            // console.log('node syncing state...');
            await nodeInstance.syncState();
          }
        } else {
          console.log('\tunhandled opcode', opCode);
        }

        await pause(100);
        await this.prismaService.incomingMsg.delete({
          where: {
            Id: incomingMsg.Id,
          },
        });

        // await pause(100);
      }
    }
  }

  stopMonitoring() {
    this.shutdown = true;
  }
}
