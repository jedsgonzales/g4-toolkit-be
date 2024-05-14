import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from '.';

@Injectable()
export class AreaService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async byId(id: number) {
    return this.prisma.area.findUnique({
      where: {
        Id: id,
      },
    });
  }

  async createArea(
    {
      areaName,
      parentAreaId,
      attachDeviceId,
    }: {
      areaName: string;
      parentAreaId?: number;
      attachDeviceId: number;
    },
    userId: string,
  ) {
    const area = await this.prisma.area.create({
      data: {
        Name: areaName,
        ParentArea: parentAreaId
          ? { connect: { Id: parentAreaId } }
          : undefined,
        CreatedOn: DateTime.utc().toJSDate(),
        CreatedBy: userId,
        UpdatedOn: DateTime.utc().toJSDate(),
        UpdatedBy: userId,
      },
    });

    if (attachDeviceId) {
      await this.prisma.networkDevice.update({
        where: { Id: attachDeviceId },
        data: {
          Area: { connect: { Id: area.Id } },
        },
      });
    }

    return area;
  }
}
