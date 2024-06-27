import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { SmartG4DbClient } from './prisma.service';
import { AreaType } from 'src/types/smart_g4';

interface AreaOpts {
  inclSubArea?: boolean;
  inclDevices?: boolean;
}

@Injectable()
export class AreaService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async unitDeviceCount(unitId: number){
    return await this.prisma.networkDevice.count({
      where: {
        AreaId: unitId,
      }
    })
  }

  async levelDeviceCount(levelId: number){
    const units = await this.prisma.area.findMany({
      where: {
        ParentAreaId: levelId,
      },
      select: {
        Id: true,
      }
    });

    return await this.prisma.networkDevice.count({
      where: {
        AreaId: { in: units.map((u) => u.Id) },
      }
    })
  }

  async propertyDeviceCount(propertyId: number){
    const levels = await this.prisma.area.findMany({
      where: {
        ParentAreaId: propertyId,
      },
      select: {
        Id: true,
      }
    });

    let count = 0;
    for(const level of levels){
      count += await this.levelDeviceCount(level.Id);
    }

    return count;
  }

  async byKeyword(keyword: string) {
    return await this.prisma.area.findMany({
      where: {
        Name: { contains: keyword.toLowerCase() },
      },
      include: {
        SubAreas: true,
        ParentArea: true,
        Devices: true,
      },
    });
  }

  async byId(id: number, opts?: AreaOpts) {
    return await this.prisma.area.findUnique({
      where: {
        Id: id,
      },
      include: {
        SubAreas: opts?.inclSubArea,
        Devices: opts?.inclDevices,
        ParentArea: true,
      },
    });
  }

  async byName(name: string, opts?: AreaOpts) {
    return await this.prisma.area.findUnique({
      where: {
        Name: name,
      },
      include: {
        SubAreas: opts?.inclSubArea,
        Devices: opts?.inclDevices,
        ParentArea: true,
      },
    });
  }

  async deleteArea(ids: number[]) {
    return await this.prisma.area.deleteMany({
      where: {
        Id: { in: ids },
      },
    });
  }

  async listArea(type: AreaType, parentId?: number, opts?: AreaOpts) {
    return await this.prisma.area.findMany({
      where: {
        Type: type,
        ParentAreaId: parentId,
      },
      include: {
        SubAreas: opts?.inclSubArea,
        Devices: opts?.inclDevices,
        ParentArea: true,
      },
    });
  }

  async saveArea(
    {
      Id,
      Name,
      Details,
      Type,
      ParentAreaId,
      attachDeviceId,
    }: {
      Id?: number | null;
      Name: string;
      Details?: string | null;
      Type: AreaType;
      ParentAreaId?: number | null;
      attachDeviceId?: number | null;
    },
    userId: string,
  ) {
    const now = DateTime.utc().toJSDate();

    const area = await (!!Id
      ? this.prisma.area.update({
          where: {
            Id: Number(Id),
          },
          data: {
            Name,
            Details,
            Type,
            ParentArea: !!ParentAreaId
              ? { connect: { Id: Number(ParentAreaId) } }
              : undefined,
            CreatedOn: now,
            CreatedBy: userId,
            UpdatedOn: now,
            UpdatedBy: userId,
          },
          include: {
            Devices: true,
            ParentArea: true,
            SubAreas: true,
          }
        })
      : this.prisma.area.create({
          data: {
            Name,
            Details,
            Type,
            ParentArea: !!ParentAreaId
              ? { connect: { Id: Number(ParentAreaId) } }
              : undefined,
            CreatedOn: now,
            CreatedBy: userId,
            UpdatedOn: now,
            UpdatedBy: userId,
          },
          include: {
            Devices: true,
            ParentArea: true,
            SubAreas: true,
          }
        }));

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
