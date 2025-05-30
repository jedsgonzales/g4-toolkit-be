import { Inject, Injectable } from '@nestjs/common';
import type { SmartG4DbClient } from './prisma.service';

@Injectable()
export class ChannelNodeService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async byId(id: number) {
    return await this.prisma.deviceChannelNode.findUnique({
      where: {
        Id: id,
      },
      include: {
        Status: true,
      },
    });
  }

  async find({
    deviceId,
    nodeNo,
    nodeType,
  }: {
    deviceId: number;
    nodeNo: number;
    nodeType: string;
  }) {
    return await this.prisma.deviceChannelNode.findFirst({
      where: {
        NodeNo: nodeNo,
        NodeType: nodeType,
        NetworkDevice: {
          DeviceId: deviceId,
        },
      },
      include: {
        Status: true,
      },
    });
  }

  async updateNode(data: {
    Id: number;
    NetworkDeviceId: number;
    NodeNo: number;
    NodeType: string;
    NodeDesc?: string;
    CustomDesc?: string;
  }) {
    return await this.prisma.deviceChannelNode.update({
      where: {
        Id: data.Id,
      },
      data: {
        NetworkDevice: { connect: { Id: data.NetworkDeviceId } },
        NodeNo: data.NodeNo,
        NodeType: data.NodeType,
        NodeDesc: data.NodeDesc,
        CustomDesc: data.CustomDesc,
      },
    });
  }

  async findOrCreate({
    deviceId,
    nodeNo,
    nodeType,
  }: {
    deviceId: number;
    nodeNo: number;
    nodeType: string;
  }) {
    let existing = await this.prisma.deviceChannelNode.findFirst({
      where: {
        NodeNo: nodeNo,
        NodeType: nodeType,
        NetworkDevice: {
          DeviceId: deviceId,
        },
      },
      include: {
        Status: true,
      },
    });

    if (!existing) {
      existing = await this.prisma.deviceChannelNode.create({
        data: {
          NodeNo: nodeNo,
          NodeType: nodeType,
          NodeDesc: `${nodeType} ${nodeNo}`,
          NetworkDevice: {
            connect: {
              Id: deviceId,
            },
          },
        },
        include: {
          Status: true,
        },
      });
    }

    return existing;
  }
}
